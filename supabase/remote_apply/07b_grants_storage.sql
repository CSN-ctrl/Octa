DROP POLICY IF EXISTS mvp_all_affiliates ON affiliates;
CREATE POLICY mvp_all_affiliates ON affiliates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_user_affiliate_codes ON user_affiliate_codes;
CREATE POLICY mvp_all_user_affiliate_codes ON user_affiliate_codes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_affiliate_referrals ON affiliate_referrals;
CREATE POLICY mvp_all_affiliate_referrals ON affiliate_referrals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- user_wallets: keep stricter (linked to auth.uid)
DROP POLICY IF EXISTS "Users can view own wallets" ON user_wallets;
CREATE POLICY "Users can view own wallets" ON user_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own wallet" ON user_wallets;
CREATE POLICY "Users can insert own wallet" ON user_wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own wallet" ON user_wallets;
CREATE POLICY "Users can update own wallet" ON user_wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own wallet" ON user_wallets;
CREATE POLICY "Users can delete own wallet" ON user_wallets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- exchange_rates / hot_wallets / usdc_deposits (mix of public read + user-scoped deposits)
DROP POLICY IF EXISTS mvp_read_exchange_rates ON exchange_rates;
CREATE POLICY mvp_read_exchange_rates ON exchange_rates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS mvp_write_exchange_rates ON exchange_rates;
CREATE POLICY mvp_write_exchange_rates ON exchange_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS mvp_read_hot_wallets ON hot_wallets;
CREATE POLICY mvp_read_hot_wallets ON hot_wallets FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS mvp_write_hot_wallets ON hot_wallets;
CREATE POLICY mvp_write_hot_wallets ON hot_wallets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own deposits" ON usdc_deposits;
DROP POLICY IF EXISTS "Users can create their own deposits" ON usdc_deposits;
DROP POLICY IF EXISTS "Users can update their own pending deposits" ON usdc_deposits;
DROP POLICY IF EXISTS mvp_all_usdc_deposits ON usdc_deposits;
CREATE POLICY mvp_all_usdc_deposits ON usdc_deposits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- expert_applications (from original schema + anon insert)
DROP POLICY IF EXISTS "Anyone can submit an application" ON expert_applications;
CREATE POLICY "Anyone can submit an application" ON expert_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users can view their own applications" ON expert_applications;
CREATE POLICY "Users can view their own applications" ON expert_applications FOR SELECT TO authenticated USING (auth.email() = email);
DROP POLICY IF EXISTS "Admins can view all applications" ON expert_applications;
CREATE POLICY "Admins can view all applications" ON expert_applications FOR SELECT TO authenticated USING (
  auth.email() IN ('admin@test.com', 'admin@example.com') OR auth.email() LIKE '%admin%'
);
DROP POLICY IF EXISTS "Admins can update applications" ON expert_applications;
CREATE POLICY "Admins can update applications" ON expert_applications FOR UPDATE TO authenticated USING (
  auth.email() IN ('admin@test.com', 'admin@example.com') OR auth.email() LIKE '%admin%'
);
DROP POLICY IF EXISTS mvp_select_expert_applications ON expert_applications;
CREATE POLICY mvp_select_expert_applications ON expert_applications FOR SELECT TO anon USING (true);

-- user_stats: public read
DROP POLICY IF EXISTS "Allow public read access to user_stats" ON user_stats;
CREATE POLICY "Allow public read access to user_stats" ON user_stats FOR SELECT TO anon, authenticated USING (true);

-- -----------------------------------------------------------------------------
-- Grants (RPCs for PostgREST)
-- -----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION get_ilo_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_plot_ownership(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION purchase_plot(INTEGER, TEXT, TEXT, NUMERIC, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mint_tokens(TEXT, NUMERIC, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION burn_tokens(TEXT, NUMERIC, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION transfer_tokens(TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_token_balance(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_balances(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_ledger_balance(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reconcile_balance(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_plot_total_ownership(INTEGER) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage: plot certificates bucket
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('plot-certificates', 'plot-certificates', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow authenticated uploads to plot-certificates" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to plot-certificates"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'plot-certificates');

DROP POLICY IF EXISTS "Allow authenticated update plot-certificates" ON storage.objects;
CREATE POLICY "Allow authenticated update plot-certificates"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'plot-certificates') WITH CHECK (bucket_id = 'plot-certificates');

DROP POLICY IF EXISTS "Allow authenticated select plot-certificates" ON storage.objects;
CREATE POLICY "Allow authenticated select plot-certificates"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'plot-certificates');

DROP POLICY IF EXISTS "Public read plot-certificates" ON storage.objects;
CREATE POLICY "Public read plot-certificates"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'plot-certificates');
