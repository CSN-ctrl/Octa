-- On-chain deposit persistence + economy RLS / RPC hardening (Sarakt prod).

-- Ensure admin helper exists (idempotent).
CREATE OR REPLACE FUNCTION public.is_dashboard_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'treasury_role') = 'admin'
      OR (
        (auth.jwt() ->> 'email') IS NOT NULL
        AND (
          lower(auth.jwt() ->> 'email') IN ('admin@test.com', 'admin@example.com', 'test@test.com')
          OR (auth.jwt() ->> 'email') ILIKE '%admin%'
        )
      )
    );
$$;

-- -----------------------------------------------------------------------------
-- On-chain deposits (AVAX → xBGL via treasury contract)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onchain_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  avax_amount NUMERIC NOT NULL CHECK (avax_amount > 0),
  xbgl_amount NUMERIC NOT NULL CHECK (xbgl_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onchain_deposits_tx_hash_unique UNIQUE (tx_hash)
);

CREATE INDEX IF NOT EXISTS idx_onchain_deposits_user_email
  ON public.onchain_deposits (lower(user_email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onchain_deposits_wallet
  ON public.onchain_deposits (lower(wallet_address), created_at DESC);

ALTER TABLE public.onchain_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS onchain_deposits_select_own ON public.onchain_deposits;
CREATE POLICY onchain_deposits_select_own ON public.onchain_deposits
  FOR SELECT TO authenticated
  USING (lower(user_email) = lower(auth.jwt() ->> 'email') OR public.is_dashboard_admin());

DROP POLICY IF EXISTS onchain_deposits_insert_own ON public.onchain_deposits;
CREATE POLICY onchain_deposits_insert_own ON public.onchain_deposits
  FOR INSERT TO authenticated
  WITH CHECK (lower(user_email) = lower(auth.jwt() ->> 'email'));

CREATE OR REPLACE FUNCTION public.record_onchain_deposit(
  p_tx_hash TEXT,
  p_wallet_address TEXT,
  p_chain_id INTEGER,
  p_avax_amount NUMERIC,
  p_xbgl_amount NUMERIC,
  p_user_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(trim(COALESCE(p_user_email, auth.jwt() ->> 'email')));
  v_hash TEXT := lower(trim(p_tx_hash));
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication required');
  END IF;
  IF v_email IS NULL OR v_email = '' OR lower(auth.jwt() ->> 'email') != v_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'email mismatch');
  END IF;
  IF v_hash IS NULL OR v_hash = '' OR NOT v_hash LIKE '0x%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid tx hash');
  END IF;
  IF p_avax_amount IS NULL OR p_avax_amount <= 0 OR p_xbgl_amount IS NULL OR p_xbgl_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amounts');
  END IF;

  IF EXISTS (SELECT 1 FROM public.onchain_deposits WHERE tx_hash = v_hash) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO public.onchain_deposits (
    user_id, user_email, wallet_address, chain_id, tx_hash, avax_amount, xbgl_amount
  ) VALUES (
    auth.uid(),
    v_email,
    lower(trim(p_wallet_address)),
    p_chain_id,
    v_hash,
    p_avax_amount,
    p_xbgl_amount
  );

  RETURN jsonb_build_object('success', true, 'duplicate', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_onchain_deposit(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, TEXT)
  TO authenticated;

-- -----------------------------------------------------------------------------
-- Wallet helper for RLS (linked wallet or email-as-wallet fallback)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_auth_wallet()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ownership_registry'
  ) THEN
    SELECT lower(o.wallet_address) INTO v_wallet
    FROM public.ownership_registry o
    WHERE lower(o.email) = lower(auth.jwt() ->> 'email')
    ORDER BY o.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;
  RETURN lower(COALESCE(v_wallet, auth.jwt() ->> 'email'));
END;
$$;

-- -----------------------------------------------------------------------------
-- Harden economy tables: replace permissive MVP policies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS mvp_all_user_balances ON public.user_balances;
DROP POLICY IF EXISTS user_balances_select_own ON public.user_balances;
CREATE POLICY user_balances_select_own ON public.user_balances
  FOR SELECT TO authenticated
  USING (
    lower(wallet_address) = public.current_auth_wallet()
    OR public.is_dashboard_admin()
  );

DROP POLICY IF EXISTS mvp_all_transactions ON public.transactions;
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
CREATE POLICY transactions_select_own ON public.transactions
  FOR SELECT TO authenticated
  USING (
    lower(from_address) = public.current_auth_wallet()
    OR lower(to_address) = public.current_auth_wallet()
    OR public.is_dashboard_admin()
  );

DROP POLICY IF EXISTS mvp_all_plots ON public.plots;
DROP POLICY IF EXISTS plots_select_all ON public.plots;
DROP POLICY IF EXISTS plots_write_admin ON public.plots;
CREATE POLICY plots_select_all ON public.plots
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY plots_write_admin ON public.plots
  FOR ALL TO authenticated
  USING (public.is_dashboard_admin())
  WITH CHECK (public.is_dashboard_admin());

DROP POLICY IF EXISTS mvp_all_usdc_deposits ON public.usdc_deposits;

-- -----------------------------------------------------------------------------
-- RPC hardening: mint requires admin; purchase requires auth + email match
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mint_tokens(
  p_to_address TEXT,
  p_amount NUMERIC,
  p_token_type TEXT DEFAULT 'xBGL',
  p_tx_hash TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT := COALESCE(NULLIF(trim(p_tx_hash), ''), 'mint_' || replace(gen_random_uuid()::text, '-', ''));
  w TEXT := lower(p_to_address);
  tt TEXT := COALESCE(NULLIF(trim(p_token_type), ''), 'xBGL');
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

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

CREATE OR REPLACE FUNCTION public.purchase_plot(
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
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication required');
  END IF;
  IF v_e IS NULL OR v_e = '' OR lower(auth.jwt() ->> 'email') != v_e THEN
    RETURN jsonb_build_object('success', false, 'error', 'email mismatch');
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.mint_tokens(TEXT, NUMERIC, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.mint_tokens(TEXT, NUMERIC, TEXT, TEXT, JSONB) TO authenticated;
