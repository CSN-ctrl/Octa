-- Idempotent mint/burn/transfer: same tx_hash must not move balances twice.
-- Previously: balances were updated then INSERT ... ON CONFLICT DO NOTHING skipped the row
-- but the function still returned success, so retries double-credited / double-debited.

CREATE OR REPLACE FUNCTION mint_tokens(
  p_to_address TEXT,
  p_amount NUMERIC,
  p_token_type TEXT DEFAULT 'xBGL',
  p_tx_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT := COALESCE(NULLIF(trim(p_tx_hash), ''), 'mint_' || replace(gen_random_uuid()::text, '-', ''));
  w TEXT := lower(p_to_address);
  tt TEXT := COALESCE(NULLIF(trim(p_token_type), ''), 'xBGL');
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amount');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_hash), 7123341);

  IF EXISTS (SELECT 1 FROM public.transactions WHERE tx_hash = v_hash) THEN
    RETURN jsonb_build_object('success', true, 'tx_hash', v_hash, 'duplicate', true);
  END IF;

  INSERT INTO user_balances (wallet_address) VALUES (w) ON CONFLICT (wallet_address) DO NOTHING;

  IF tt = 'xBGL' THEN
    UPDATE user_balances SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSIF tt = 'CHAOS' THEN
    UPDATE user_balances SET chaos_balance = COALESCE(chaos_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSIF tt = 'AVAX' THEN
    UPDATE user_balances SET avax_balance = COALESCE(avax_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSIF tt = 'SC' THEN
    UPDATE user_balances SET sc_balance = COALESCE(sc_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSE
    UPDATE user_balances SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = w;
  END IF;

  INSERT INTO transactions (
    from_address, to_address, amount, token_type, transaction_type, type, tx_hash, status, metadata
  ) VALUES (
    '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33', w, p_amount, tt, 'mint', 'mint',
    v_hash, 'completed', COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object('success', true, 'tx_hash', v_hash, 'duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION burn_tokens(
  p_from_address TEXT,
  p_amount NUMERIC,
  p_token_type TEXT DEFAULT 'xBGL',
  p_tx_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT := COALESCE(NULLIF(trim(p_tx_hash), ''), 'burn_' || replace(gen_random_uuid()::text, '-', ''));
  w TEXT := lower(p_from_address);
  tt TEXT := COALESCE(NULLIF(trim(p_token_type), ''), 'xBGL');
  cur NUMERIC;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amount');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_hash), 7123341);

  IF EXISTS (SELECT 1 FROM public.transactions WHERE tx_hash = v_hash) THEN
    RETURN jsonb_build_object('success', true, 'tx_hash', v_hash, 'duplicate', true);
  END IF;

  SELECT
    CASE tt
      WHEN 'xBGL' THEN COALESCE(xbgl_balance, 0)
      WHEN 'CHAOS' THEN COALESCE(chaos_balance, 0)
      WHEN 'AVAX' THEN COALESCE(avax_balance, 0)
      WHEN 'SC' THEN COALESCE(sc_balance, 0)
      ELSE COALESCE(xbgl_balance, 0)
    END INTO cur
  FROM user_balances WHERE wallet_address = w;

  IF cur IS NULL OR cur < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient balance');
  END IF;

  IF tt = 'xBGL' THEN
    UPDATE user_balances SET xbgl_balance = xbgl_balance - p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSIF tt = 'CHAOS' THEN
    UPDATE user_balances SET chaos_balance = chaos_balance - p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSIF tt = 'AVAX' THEN
    UPDATE user_balances SET avax_balance = avax_balance - p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSIF tt = 'SC' THEN
    UPDATE user_balances SET sc_balance = sc_balance - p_amount, last_synced = NOW() WHERE wallet_address = w;
  ELSE
    UPDATE user_balances SET xbgl_balance = xbgl_balance - p_amount, last_synced = NOW() WHERE wallet_address = w;
  END IF;

  INSERT INTO transactions (
    from_address, to_address, amount, token_type, transaction_type, type, tx_hash, status, metadata
  ) VALUES (
    w, '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33', p_amount, tt, 'burn', 'burn',
    v_hash, 'completed', COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object('success', true, 'tx_hash', v_hash, 'duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION transfer_tokens(
  p_from_address TEXT,
  p_to_address TEXT,
  p_amount NUMERIC,
  p_token_type TEXT DEFAULT 'xBGL',
  p_tx_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT := COALESCE(NULLIF(trim(p_tx_hash), ''), 'xfer_' || replace(gen_random_uuid()::text, '-', ''));
  fa TEXT := lower(p_from_address);
  ta TEXT := lower(p_to_address);
  tt TEXT := COALESCE(NULLIF(trim(p_token_type), ''), 'xBGL');
  cur NUMERIC;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amount');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_hash), 7123341);

  IF EXISTS (SELECT 1 FROM public.transactions WHERE tx_hash = v_hash) THEN
    RETURN jsonb_build_object('success', true, 'tx_hash', v_hash, 'duplicate', true);
  END IF;

  SELECT
    CASE tt
      WHEN 'xBGL' THEN COALESCE(xbgl_balance, 0)
      WHEN 'CHAOS' THEN COALESCE(chaos_balance, 0)
      WHEN 'AVAX' THEN COALESCE(avax_balance, 0)
      WHEN 'SC' THEN COALESCE(sc_balance, 0)
      ELSE COALESCE(xbgl_balance, 0)
    END INTO cur
  FROM user_balances WHERE wallet_address = fa;

  IF cur IS NULL OR cur < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient balance');
  END IF;

  INSERT INTO user_balances (wallet_address) VALUES (ta) ON CONFLICT (wallet_address) DO NOTHING;

  IF tt = 'xBGL' THEN
    UPDATE user_balances SET xbgl_balance = xbgl_balance - p_amount, last_synced = NOW() WHERE wallet_address = fa;
    UPDATE user_balances SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = ta;
  ELSIF tt = 'CHAOS' THEN
    UPDATE user_balances SET chaos_balance = chaos_balance - p_amount, last_synced = NOW() WHERE wallet_address = fa;
    UPDATE user_balances SET chaos_balance = COALESCE(chaos_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = ta;
  ELSIF tt = 'AVAX' THEN
    UPDATE user_balances SET avax_balance = avax_balance - p_amount, last_synced = NOW() WHERE wallet_address = fa;
    UPDATE user_balances SET avax_balance = COALESCE(avax_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = ta;
  ELSIF tt = 'SC' THEN
    UPDATE user_balances SET sc_balance = sc_balance - p_amount, last_synced = NOW() WHERE wallet_address = fa;
    UPDATE user_balances SET sc_balance = COALESCE(sc_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = ta;
  ELSE
    UPDATE user_balances SET xbgl_balance = xbgl_balance - p_amount, last_synced = NOW() WHERE wallet_address = fa;
    UPDATE user_balances SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount, last_synced = NOW() WHERE wallet_address = ta;
  END IF;

  INSERT INTO transactions (
    from_address, to_address, amount, token_type, transaction_type, type, tx_hash, status, metadata
  ) VALUES (
    fa, ta, p_amount, tt, 'transfer', 'transfer', v_hash, 'completed', COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object('success', true, 'tx_hash', v_hash, 'duplicate', false);
END;
$$;
