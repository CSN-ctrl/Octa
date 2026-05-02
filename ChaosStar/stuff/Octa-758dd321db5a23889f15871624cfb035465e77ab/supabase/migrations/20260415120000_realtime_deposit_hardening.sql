-- Realtime deposit hardening:
-- - add ingest checkpoints
-- - add conversion failure visibility
-- - enforce deposit idempotency at schema level
-- - disable balance-triggered synthetic ledger writes
-- - keep auto-conversion trigger non-fatal and replayable

CREATE TABLE IF NOT EXISTS public.treasury_ingest_checkpoints (
  chain_id text PRIMARY KEY,
  last_scanned_block bigint NOT NULL DEFAULT 0,
  last_scanned_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deposit_conversion_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NULL,
  tx_hash text NOT NULL,
  source_tx_hash text NOT NULL,
  user_wallet text NULL,
  network_id text NULL,
  usdc_amount numeric NULL,
  error_message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_deposit_conversion_failures_source_hash
  ON public.deposit_conversion_failures (source_tx_hash);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ux_usdc_deposits_network_tx_hash'
  ) THEN
    ALTER TABLE public.usdc_deposits
      ADD CONSTRAINT ux_usdc_deposits_network_tx_hash UNIQUE (network_id, tx_hash);
  END IF;
END $$;

-- Prevent duplicate synthetic ledger rows generated from balance updates.
DROP TRIGGER IF EXISTS balance_change_transaction ON public.user_balances;

CREATE OR REPLACE FUNCTION public.get_ledger_balance_by_wallet(
  p_wallet_address text,
  p_token_type text DEFAULT 'xBGL'
)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN lower(to_address) = lower(p_wallet_address) THEN amount
      WHEN lower(from_address) = lower(p_wallet_address) THEN -amount
      ELSE 0
    END
  ), 0)
  FROM public.transactions
  WHERE status = 'completed'
    AND upper(token_type) = upper(p_token_type)
    AND (
      lower(from_address) = lower(p_wallet_address)
      OR lower(to_address) = lower(p_wallet_address)
    );
$$;

CREATE OR REPLACE FUNCTION public.auto_convert_treasury_usdc_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_from text := lower(coalesce(NEW.from_address, ''));
  v_to text := lower(coalesce(NEW.to_address, ''));
  v_token text := upper(coalesce(NEW.token_type, ''));
  v_existing_id uuid;
  v_user_email text;
  v_xbgl numeric;
  v_deposit_id uuid;
  v_chain text;
  v_source_hash text := lower(coalesce(nullif(trim(NEW.metadata->>'source_tx_hash'), ''), trim(NEW.tx_hash)));
BEGIN
  IF v_to <> v_treasury THEN
    RETURN NEW;
  END IF;

  IF NEW.tx_hash IS NULL OR btrim(NEW.tx_hash) = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.transaction_type IN ('deposit_converted', 'treasury_transfer') THEN
    RETURN NEW;
  END IF;

  IF v_token <> 'USDC' OR NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing_id
  FROM public.transactions
  WHERE tx_hash = lower(NEW.tx_hash) || '_converted'
     OR lower(coalesce(metadata->>'source_tx_hash', '')) = v_source_hash
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT lower(o.email) INTO v_user_email
  FROM public.ownership_registry o
  WHERE lower(o.wallet_address) = v_from
  ORDER BY o.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_user_email IS NULL OR v_user_email = '' THEN
    v_user_email := v_from;
  END IF;

  v_xbgl := public.convert_usdc_to_xbgl(NEW.amount);
  v_chain := COALESCE(NEW.metadata->>'chain', 'unknown');

  INSERT INTO public.usdc_deposits (
    user_email, user_wallet, network_id, usdc_amount, xbgl_amount, tx_hash, hot_wallet_address, status, confirmed_at, metadata
  ) VALUES (
    v_user_email,
    v_from,
    v_chain,
    NEW.amount,
    v_xbgl,
    lower(NEW.tx_hash),
    v_treasury,
    'confirmed',
    now(),
    jsonb_build_object(
      'source', 'transactions_trigger',
      'source_transaction_id', NEW.id,
      'source_tx_hash', v_source_hash,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  )
  ON CONFLICT (network_id, tx_hash)
  DO UPDATE SET
    xbgl_amount = EXCLUDED.xbgl_amount,
    metadata = COALESCE(public.usdc_deposits.metadata, '{}'::jsonb) || EXCLUDED.metadata
  RETURNING id INTO v_deposit_id;

  PERFORM public.internal_treasury_transfer_for_deposit(
    v_from,
    v_xbgl,
    NEW.tx_hash,
    jsonb_build_object(
      'deposit_id', v_deposit_id,
      'network_id', v_chain,
      'usdc_amount', NEW.amount,
      'source_tx_hash', v_source_hash,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    INSERT INTO public.deposit_conversion_failures (
      transaction_id, tx_hash, source_tx_hash, user_wallet, network_id, usdc_amount, error_message, metadata
    ) VALUES (
      NEW.id,
      lower(coalesce(NEW.tx_hash, '')),
      v_source_hash,
      v_from,
      COALESCE(NEW.metadata->>'chain', 'unknown'),
      NEW.amount,
      SQLERRM,
      jsonb_build_object('trigger', 'auto_convert_treasury_usdc_deposit')
    );

    UPDATE public.transactions
    SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'conversion_status', 'failed',
      'conversion_error', SQLERRM,
      'conversion_failed_at', now()
    )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_convert_treasury_usdc_deposit ON public.transactions;
CREATE TRIGGER trg_auto_convert_treasury_usdc_deposit
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.auto_convert_treasury_usdc_deposit();
