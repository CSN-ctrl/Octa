-- Canonical conversion model:
-- 1 EUR = 1.955833 xBGL (fixed).
-- USDC equivalent is derived from EUR->USDC market rate in exchange_rates.

CREATE OR REPLACE FUNCTION public.get_eur_to_xbgl_rate()
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 1.955833::numeric;
$$;

CREATE OR REPLACE FUNCTION public.get_eur_to_usdc_rate()
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((
    SELECT er.rate
    FROM public.exchange_rates er
    WHERE upper(er.from_token) = 'EUR'
      AND upper(er.to_token) = 'USDC'
    ORDER BY er.updated_at DESC NULLS LAST
    LIMIT 1
  ), 1.0::numeric);
$$;

CREATE OR REPLACE FUNCTION public.get_usdc_to_xbgl_rate()
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_eur_to_xbgl_rate() / NULLIF(public.get_eur_to_usdc_rate(), 0);
$$;

CREATE OR REPLACE FUNCTION public.convert_usdc_to_xbgl(p_usdc_amount numeric)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(p_usdc_amount, 0) * public.get_usdc_to_xbgl_rate();
$$;

-- Ensure EUR->USDC exists for equivalent conversion path.
INSERT INTO public.exchange_rates (from_token, to_token, rate)
VALUES ('EUR', 'USDC', 1.0)
ON CONFLICT (from_token, to_token) DO NOTHING;

-- Replace user confirmation RPC to compute xBGL server-side from USDC amount.
CREATE OR REPLACE FUNCTION public.confirm_usdc_deposit_and_credit(
  p_deposit_id uuid,
  p_tx_hash text,
  p_user_wallet text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_deposit public.usdc_deposits%ROWTYPE;
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_recipient text;
  v_conversion_tx_hash text;
  v_xbgl_amount numeric;
BEGIN
  v_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  IF v_email = '' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_deposit_id IS NULL THEN
    RAISE EXCEPTION 'invalid deposit id';
  END IF;

  IF p_tx_hash IS NULL OR btrim(p_tx_hash) = '' THEN
    RAISE EXCEPTION 'missing tx_hash';
  END IF;

  SELECT *
  INTO v_deposit
  FROM public.usdc_deposits
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deposit not found';
  END IF;

  IF lower(v_deposit.user_email) <> v_email THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_recipient := lower(
    coalesce(
      nullif(trim(p_user_wallet), ''),
      nullif(trim(v_deposit.user_wallet), ''),
      nullif(trim(v_deposit.user_email), '')
    )
  );

  IF v_recipient IS NULL OR v_recipient = '' THEN
    RAISE EXCEPTION 'missing recipient';
  END IF;

  v_xbgl_amount := public.convert_usdc_to_xbgl(v_deposit.usdc_amount);

  v_conversion_tx_hash := lower(trim(p_tx_hash)) || '_converted';
  PERFORM pg_advisory_xact_lock(hashtext(v_conversion_tx_hash), 912001);

  IF EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.tx_hash = v_conversion_tx_hash
  ) THEN
    UPDATE public.usdc_deposits
    SET
      status = 'confirmed',
      tx_hash = lower(trim(p_tx_hash)),
      user_wallet = v_recipient,
      xbgl_amount = v_xbgl_amount,
      confirmed_at = COALESCE(confirmed_at, now()),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'auto_credit_duplicate', true,
        'conversion_tx_hash', v_conversion_tx_hash,
        'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
        'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
        'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
      )
    WHERE id = p_deposit_id;

    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'tx_hash', v_conversion_tx_hash);
  END IF;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_treasury, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_recipient, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  UPDATE public.user_balances
  SET
    xbgl_balance = COALESCE(xbgl_balance, 0) - v_xbgl_amount,
    last_synced = now()
  WHERE wallet_address = v_treasury
    AND COALESCE(xbgl_balance, 0) >= v_xbgl_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient treasury balance';
  END IF;

  UPDATE public.user_balances
  SET
    xbgl_balance = COALESCE(xbgl_balance, 0) + v_xbgl_amount,
    last_synced = now()
  WHERE wallet_address = v_recipient;

  INSERT INTO public.transactions (
    from_address, to_address, amount, token_type, transaction_type, type, status, tx_hash, metadata
  ) VALUES (
    v_treasury,
    v_recipient,
    v_xbgl_amount,
    'xBGL',
    'treasury_transfer',
    'deposit_conversion',
    'completed',
    v_conversion_tx_hash,
    jsonb_build_object(
      'deposit_id', v_deposit.id,
      'source_tx_hash', lower(trim(p_tx_hash)),
      'usdc_amount', v_deposit.usdc_amount,
      'network_id', v_deposit.network_id,
      'deposit_auto_conversion', true,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  );

  UPDATE public.usdc_deposits
  SET
    status = 'confirmed',
    tx_hash = lower(trim(p_tx_hash)),
    user_wallet = v_recipient,
    xbgl_amount = v_xbgl_amount,
    confirmed_at = COALESCE(confirmed_at, now()),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'auto_credited', true,
      'conversion_tx_hash', v_conversion_tx_hash,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  WHERE id = p_deposit_id;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'tx_hash', v_conversion_tx_hash);
END;
$$;

-- Rebuild trigger automation with canonical conversion function.
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
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  )
  RETURNING id INTO v_deposit_id;

  PERFORM public.internal_treasury_transfer_for_deposit(
    v_from,
    v_xbgl,
    NEW.tx_hash,
    jsonb_build_object(
      'deposit_id', v_deposit_id,
      'network_id', v_chain,
      'usdc_amount', NEW.amount,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;
