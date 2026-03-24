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
  ) ON CONFLICT (tx_hash) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'tx_hash', v_hash);
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
  ) ON CONFLICT (tx_hash) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'tx_hash', v_hash);
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
  ) ON CONFLICT (tx_hash) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'tx_hash', v_hash);
END;
$$;

CREATE OR REPLACE FUNCTION get_token_balance(p_wallet_address TEXT, p_token_type TEXT DEFAULT 'xBGL')
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v NUMERIC;
  w TEXT := lower(p_wallet_address);
  tt TEXT := COALESCE(NULLIF(trim(p_token_type), ''), 'xBGL');
BEGIN
  SELECT
    CASE tt
      WHEN 'xBGL' THEN COALESCE(xbgl_balance, 0)
      WHEN 'CHAOS' THEN COALESCE(chaos_balance, 0)
      WHEN 'AVAX' THEN COALESCE(avax_balance, 0)
      WHEN 'SC' THEN COALESCE(sc_balance, 0)
      ELSE COALESCE(xbgl_balance, 0)
    END INTO v
  FROM user_balances WHERE wallet_address = w;
  RETURN COALESCE(v, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_all_balances(p_wallet_address TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r user_balances%ROWTYPE;
  w TEXT := lower(p_wallet_address);
BEGIN
  SELECT * INTO r FROM user_balances WHERE wallet_address = w;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'xBGL', 0, 'CHAOS', 0, 'AVAX', 0, 'SC', 0, 'last_synced', NULL
    );
  END IF;
  RETURN jsonb_build_object(
    'xBGL', COALESCE(r.xbgl_balance, 0),
    'CHAOS', COALESCE(r.chaos_balance, 0),
    'AVAX', COALESCE(r.avax_balance, 0),
    'SC', COALESCE(r.sc_balance, 0),
    'last_synced', r.last_synced
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------
INSERT INTO exchange_rates (from_token, to_token, rate)
VALUES ('EUR', 'xBGL', 1.955833), ('EUR', 'USDC', 1.1)
ON CONFLICT (from_token, to_token) DO NOTHING;

INSERT INTO ilo_stats (total_spots, spots_taken, total_raised_usdc, total_raised_eur, participants_count, is_active)
SELECT 10000, 0, 0, 0, 0, true
WHERE NOT EXISTS (SELECT 1 FROM ilo_stats LIMIT 1);

INSERT INTO genesis_stats (id, ilo_closed, secondary_market_active)
VALUES ('default', false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_stats (id, total_users)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 0)
ON CONFLICT (id) DO NOTHING;

UPDATE user_stats
SET total_users = (SELECT COUNT(*) FROM auth.users), last_updated = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
