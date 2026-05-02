-- Phase 2 backend automation:
-- Auto-convert incoming USDC treasury deposits to xBGL on transaction ingest.

CREATE OR REPLACE FUNCTION public.internal_treasury_transfer_for_deposit(
  p_recipient text,
  p_amount numeric,
  p_source_tx_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient text := lower(trim(p_recipient));
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_conversion_tx_hash text := lower(trim(p_source_tx_hash)) || '_converted';
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  IF v_recipient IS NULL OR v_recipient = '' THEN
    RAISE EXCEPTION 'invalid recipient';
  END IF;

  IF p_source_tx_hash IS NULL OR btrim(p_source_tx_hash) = '' THEN
    RAISE EXCEPTION 'missing source tx hash';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_conversion_tx_hash), 913003);

  IF EXISTS (SELECT 1 FROM public.transactions WHERE tx_hash = v_conversion_tx_hash) THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'tx_hash', v_conversion_tx_hash);
  END IF;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_treasury, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_recipient, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  UPDATE public.user_balances
  SET xbgl_balance = COALESCE(xbgl_balance, 0) - p_amount,
      last_synced = now()
  WHERE wallet_address = v_treasury
    AND COALESCE(xbgl_balance, 0) >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient treasury balance';
  END IF;

  UPDATE public.user_balances
  SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount,
      last_synced = now()
  WHERE wallet_address = v_recipient;

  INSERT INTO public.transactions (
    from_address,
    to_address,
    amount,
    token_type,
    transaction_type,
    type,
    status,
    tx_hash,
    metadata
  ) VALUES (
    v_treasury,
    v_recipient,
    p_amount,
    'xBGL',
    'treasury_transfer',
    'deposit_conversion',
    'completed',
    v_conversion_tx_hash,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'deposit_auto_conversion', true,
      'source_tx_hash', lower(trim(p_source_tx_hash))
    )
  );

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'tx_hash', v_conversion_tx_hash);
END;
$$;

REVOKE ALL ON FUNCTION public.internal_treasury_transfer_for_deposit(text, numeric, text, jsonb) FROM PUBLIC;

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
  v_rate numeric := 1;
  v_xbgl numeric;
  v_deposit_id uuid;
BEGIN
  IF v_to <> v_treasury THEN
    RETURN NEW;
  END IF;

  IF NEW.tx_hash IS NULL OR btrim(NEW.tx_hash) = '' THEN
    RETURN NEW;
  END IF;

  -- Ignore conversion/system rows.
  IF NEW.transaction_type IN ('deposit_converted', 'treasury_transfer') THEN
    RETURN NEW;
  END IF;

  -- Strict to USDC deposits.
  IF v_token <> 'USDC' THEN
    RETURN NEW;
  END IF;

  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing_id
  FROM public.transactions
  WHERE tx_hash = lower(NEW.tx_hash) || '_converted'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT lower(o.email) INTO v_user_email
  FROM public.ownership_registry o
  WHERE lower(o.wallet_address) = v_from
  ORDER BY o.updated_at DESC NULLS LAST
  LIMIT 1;

  -- Fallback for wallet-only users.
  IF v_user_email IS NULL OR v_user_email = '' THEN
    v_user_email := v_from;
  END IF;

  SELECT COALESCE(rate, 1)
  INTO v_rate
  FROM public.exchange_rates
  WHERE upper(from_token) = 'USDC'
    AND upper(to_token) = 'XBGL'
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  v_xbgl := NEW.amount * COALESCE(v_rate, 1);

  INSERT INTO public.usdc_deposits (
    user_email,
    user_wallet,
    network_id,
    usdc_amount,
    xbgl_amount,
    tx_hash,
    hot_wallet_address,
    status,
    confirmed_at,
    metadata
  ) VALUES (
    v_user_email,
    v_from,
    COALESCE(NEW.metadata->>'chain', 'unknown'),
    NEW.amount,
    v_xbgl,
    lower(NEW.tx_hash),
    v_treasury,
    'confirmed',
    now(),
    jsonb_build_object(
      'source', 'transactions_trigger',
      'source_transaction_id', NEW.id,
      'exchange_rate', COALESCE(v_rate, 1)
    )
  )
  RETURNING id INTO v_deposit_id;

  PERFORM public.internal_treasury_transfer_for_deposit(
    v_from,
    v_xbgl,
    NEW.tx_hash,
    jsonb_build_object(
      'deposit_id', v_deposit_id,
      'network_id', COALESCE(NEW.metadata->>'chain', 'unknown'),
      'usdc_amount', NEW.amount
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Idempotent safety for repeated ingestion.
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_convert_treasury_usdc_deposit ON public.transactions;
CREATE TRIGGER trg_auto_convert_treasury_usdc_deposit
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.auto_convert_treasury_usdc_deposit();
