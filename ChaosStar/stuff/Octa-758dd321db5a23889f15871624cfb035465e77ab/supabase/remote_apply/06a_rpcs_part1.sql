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
