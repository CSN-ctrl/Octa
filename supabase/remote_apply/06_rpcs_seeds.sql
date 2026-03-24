-- -----------------------------------------------------------------------------
-- USDC deposit → balance
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION credit_xbgl_on_deposit_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance)
    VALUES (lower(NEW.user_email), NEW.xbgl_amount, 0, 0, 0)
    ON CONFLICT (wallet_address)
    DO UPDATE SET
      xbgl_balance = COALESCE(user_balances.xbgl_balance, 0) + NEW.xbgl_amount,
      last_synced = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_credit_xbgl_on_deposit ON usdc_deposits;
CREATE TRIGGER auto_credit_xbgl_on_deposit
  AFTER UPDATE OF status ON usdc_deposits
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed')
  EXECUTE FUNCTION credit_xbgl_on_deposit_confirmation();

-- -----------------------------------------------------------------------------
-- Affiliate aggregate stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE affiliates SET
    total_referrals = (SELECT COUNT(*) FROM affiliate_referrals WHERE referrer_wallet = NEW.referrer_wallet),
    total_commission = (SELECT COALESCE(SUM(commission_amount), 0) FROM affiliate_referrals WHERE referrer_wallet = NEW.referrer_wallet),
    updated_at = NOW()
  WHERE wallet_address = NEW.referrer_wallet;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON affiliate_referrals;
CREATE TRIGGER trigger_update_affiliate_stats
  AFTER INSERT ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats();

-- -----------------------------------------------------------------------------
-- User count (auth.users)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE user_stats
  SET total_users = (SELECT COUNT(*) FROM auth.users), last_updated = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS update_user_count_on_insert ON auth.users;
CREATE TRIGGER update_user_count_on_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_count();

DROP TRIGGER IF EXISTS update_user_count_on_delete ON auth.users;
CREATE TRIGGER update_user_count_on_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_count();

-- -----------------------------------------------------------------------------
-- RPC: ILO stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_ilo_stats()
RETURNS TABLE (
  total_spots INTEGER,
  spots_taken INTEGER,
  spots_remaining INTEGER,
  total_raised_usdc NUMERIC,
  total_raised_eur NUMERIC,
  participants_count INTEGER,
  progress_percentage NUMERIC,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.total_spots, s.spots_taken, (s.total_spots - s.spots_taken) AS spots_remaining,
    s.total_raised_usdc, s.total_raised_eur, s.participants_count,
    CASE WHEN s.total_spots > 0 THEN ROUND((s.spots_taken::NUMERIC / s.total_spots::NUMERIC) * 100, 2) ELSE 0 END,
    s.is_active
  FROM ilo_stats s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;

-- -----------------------------------------------------------------------------
-- RPC: plot ownership (used by app)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_plot_ownership(p_plot_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r plots%ROWTYPE;
  v_email TEXT;
BEGIN
  SELECT * INTO r FROM plots WHERE id = p_plot_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'owned', false, 'plot_id', p_plot_id, 'error', 'plot not found');
  END IF;

  IF r.owner_wallet IS NOT NULL AND r.owner_wallet <> '' THEN
    SELECT email INTO v_email FROM ownership_registry WHERE lower(wallet_address) = lower(r.owner_wallet) LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'owned', (r.owner_wallet IS NOT NULL AND r.owner_wallet <> ''),
    'plot_id', p_plot_id,
    'owner_wallet', r.owner_wallet,
    'owner_email', v_email,
    'booking_status', r.booking_status
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- RPC: purchase plot (minimal — updates plot + registry + purchase row)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purchase_plot(
  p_plot_id INTEGER,
  p_buyer_wallet TEXT,
  p_buyer_email TEXT,
  p_price NUMERIC,
  p_currency TEXT DEFAULT 'xBGL'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w TEXT := lower(p_buyer_wallet);
  v_e TEXT := lower(trim(p_buyer_email));
  v_purchase_id UUID;
  v_updated INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM plots WHERE id = p_plot_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot not found');
  END IF;

  UPDATE plots
  SET owner_wallet = v_w, booking_status = 'purchased', updated_at = NOW()
  WHERE id = p_plot_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot not found');
  END IF;

  INSERT INTO ownership_registry (wallet_address, email, updated_at)
  VALUES (v_w, v_e, NOW())
  ON CONFLICT (wallet_address) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();

  INSERT INTO plot_purchases (plot_id, buyer_wallet, purchase_price, currency, status)
  VALUES (p_plot_id, v_w, p_price, COALESCE(p_currency, 'xBGL'), 'completed')
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object(
    'success', true,
    'plot_id', p_plot_id,
    'purchase_id', v_purchase_id,
    'txHash', 'purchase_' || p_plot_id::text || '_' || extract(epoch FROM NOW())::text
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- RPC: token helpers (mint / burn / transfer / balances)
-- -----------------------------------------------------------------------------
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
