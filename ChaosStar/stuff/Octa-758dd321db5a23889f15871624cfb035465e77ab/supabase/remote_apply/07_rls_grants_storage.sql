-- -----------------------------------------------------------------------------
-- Row Level Security (permissive MVP — tighten for production)
-- -----------------------------------------------------------------------------
ALTER TABLE star_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_ticks ENABLE ROW LEVEL SECURITY;
ALTER TABLE black_market_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usdc_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliate_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ilo_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ilo_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ilo_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_fractional_shares ENABLE ROW LEVEL SECURITY;

-- Permissive MVP policies (wallet-first clients). Tighten before production.
DROP POLICY IF EXISTS mvp_all_star_systems ON star_systems;
CREATE POLICY mvp_all_star_systems ON star_systems FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_planets ON planets;
CREATE POLICY mvp_all_planets ON planets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_plots ON plots;
CREATE POLICY mvp_all_plots ON plots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_user_balances ON user_balances;
CREATE POLICY mvp_all_user_balances ON user_balances FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_digital_identities ON digital_identities;
CREATE POLICY mvp_all_digital_identities ON digital_identities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_portfolios ON portfolios;
CREATE POLICY mvp_all_portfolios ON portfolios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_portfolio_managers ON portfolio_managers;
CREATE POLICY mvp_all_portfolio_managers ON portfolio_managers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_portfolio_followers ON portfolio_followers;
CREATE POLICY mvp_all_portfolio_followers ON portfolio_followers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_automation_settings ON automation_settings;
CREATE POLICY mvp_all_automation_settings ON automation_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_recurring_payments ON recurring_payments;
CREATE POLICY mvp_all_recurring_payments ON recurring_payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_marketplace_listings ON marketplace_listings;
CREATE POLICY mvp_all_marketplace_listings ON marketplace_listings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_transactions ON transactions;
CREATE POLICY mvp_all_transactions ON transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_factions ON factions;
CREATE POLICY mvp_all_factions ON factions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_npcs ON npcs;
CREATE POLICY mvp_all_npcs ON npcs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_economy_ticks ON economy_ticks;
CREATE POLICY mvp_all_economy_ticks ON economy_ticks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_black_market_invites ON black_market_invites;
CREATE POLICY mvp_all_black_market_invites ON black_market_invites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_ownership_registry ON ownership_registry;
CREATE POLICY mvp_all_ownership_registry ON ownership_registry FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_plot_purchases ON plot_purchases;
CREATE POLICY mvp_all_plot_purchases ON plot_purchases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_cities ON cities;
CREATE POLICY mvp_all_cities ON cities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_plot_documents ON plot_documents;
CREATE POLICY mvp_all_plot_documents ON plot_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_ilo_stats ON ilo_stats;
CREATE POLICY mvp_all_ilo_stats ON ilo_stats FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_ilo_phases ON ilo_phases;
CREATE POLICY mvp_all_ilo_phases ON ilo_phases FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_ilo_participants ON ilo_participants;
CREATE POLICY mvp_all_ilo_participants ON ilo_participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_genesis_stats ON genesis_stats;
CREATE POLICY mvp_all_genesis_stats ON genesis_stats FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_genesis_prizes ON genesis_prizes;
CREATE POLICY mvp_all_genesis_prizes ON genesis_prizes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_social_media_verifications ON social_media_verifications;
CREATE POLICY mvp_all_social_media_verifications ON social_media_verifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS mvp_all_plot_fractional_shares ON plot_fractional_shares;
CREATE POLICY mvp_all_plot_fractional_shares ON plot_fractional_shares FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
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
