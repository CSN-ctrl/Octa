-- Atomic treasury transfer RPC to prevent duplicate/double-spend writes.
-- Uses a single DB transaction with balance guard and idempotency by tx_hash.

CREATE OR REPLACE FUNCTION public.admin_treasury_transfer(
  p_recipient text,
  p_amount numeric,
  p_tx_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_recipient text := lower(trim(p_recipient));
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_treasury_after numeric;
  v_existing_tx_id uuid;
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  IF v_recipient IS NULL OR v_recipient = '' THEN
    RAISE EXCEPTION 'invalid recipient';
  END IF;

  IF p_tx_hash IS NULL OR btrim(p_tx_hash) = '' THEN
    RAISE EXCEPTION 'missing tx_hash';
  END IF;

  -- Idempotency guard: same tx hash => already processed.
  SELECT t.id INTO v_existing_tx_id
  FROM public.transactions t
  WHERE t.tx_hash = p_tx_hash
  LIMIT 1;

  IF v_existing_tx_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'tx_hash', p_tx_hash
    );
  END IF;

  -- Ensure both balance rows exist.
  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_treasury, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_recipient, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  -- Atomic debit with balance guard.
  UPDATE public.user_balances
  SET xbgl_balance = COALESCE(xbgl_balance, 0) - p_amount,
      last_synced = now()
  WHERE wallet_address = v_treasury
    AND COALESCE(xbgl_balance, 0) >= p_amount
  RETURNING xbgl_balance INTO v_treasury_after;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient treasury balance';
  END IF;

  -- Credit recipient.
  UPDATE public.user_balances
  SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount,
      last_synced = now()
  WHERE wallet_address = v_recipient;

  -- Record ledger transaction.
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
  )
  VALUES (
    v_treasury,
    v_recipient,
    p_amount,
    'xBGL',
    'treasury_transfer',
    'transfer',
    'completed',
    p_tx_hash,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'rpc_transfer', true,
      'server_timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'tx_hash', p_tx_hash,
    'treasury_balance', v_treasury_after
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Defensive idempotency fallback if tx_hash unique index exists.
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'tx_hash', p_tx_hash
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_treasury_transfer(text, numeric, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_treasury_transfer(text, numeric, text, jsonb) TO authenticated;

