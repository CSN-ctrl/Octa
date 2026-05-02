-- Secure user-owned deposit confirmation with atomic treasury -> user xBGL transfer.
-- This removes the need for client-side balance mutation and keeps transfer ledgered.

-- Disable legacy direct-credit trigger to avoid double-credit with treasury conversion.
DROP TRIGGER IF EXISTS auto_credit_xbgl_on_deposit ON public.usdc_deposits;
DROP FUNCTION IF EXISTS public.credit_xbgl_on_deposit_confirmation();

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

  v_conversion_tx_hash := lower(trim(p_tx_hash)) || '_converted';
  PERFORM pg_advisory_xact_lock(hashtext(v_conversion_tx_hash), 912001);

  IF EXISTS (
    SELECT 1
    FROM public.transactions t
    WHERE t.tx_hash = v_conversion_tx_hash
  ) THEN
    UPDATE public.usdc_deposits
    SET
      status = 'confirmed',
      tx_hash = lower(trim(p_tx_hash)),
      user_wallet = v_recipient,
      confirmed_at = COALESCE(confirmed_at, now()),
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'auto_credit_duplicate', true,
        'conversion_tx_hash', v_conversion_tx_hash
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
    xbgl_balance = COALESCE(xbgl_balance, 0) - v_deposit.xbgl_amount,
    last_synced = now()
  WHERE wallet_address = v_treasury
    AND COALESCE(xbgl_balance, 0) >= v_deposit.xbgl_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient treasury balance';
  END IF;

  UPDATE public.user_balances
  SET
    xbgl_balance = COALESCE(xbgl_balance, 0) + v_deposit.xbgl_amount,
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
    v_deposit.xbgl_amount,
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
      'deposit_auto_conversion', true
    )
  );

  UPDATE public.usdc_deposits
  SET
    status = 'confirmed',
    tx_hash = lower(trim(p_tx_hash)),
    user_wallet = v_recipient,
    confirmed_at = COALESCE(confirmed_at, now()),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'auto_credited', true,
      'conversion_tx_hash', v_conversion_tx_hash
    )
  WHERE id = p_deposit_id;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'tx_hash', v_conversion_tx_hash);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_usdc_deposit_and_credit(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_usdc_deposit_and_credit(uuid, text, text) TO authenticated;

-- Ensure dashboard admin auth check RPC is executable by authenticated clients.
GRANT EXECUTE ON FUNCTION public.is_dashboard_admin() TO authenticated;
