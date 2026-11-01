-- Octa Investment Group — staging QA seed (run manually on a **staging** Supabase project only)
-- 1) Apply all migrations through 20260611160000_phase1_cap_per_plot_basic_expat.sql
-- 2) Run this file with the SQL editor or: psql $DATABASE_URL -f supabase/seeds/staging_sarakt_qa.sql

INSERT INTO public.platform_runtime_config (key, value, updated_at)
VALUES ('environment', 'staging', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Test wallets (Fuji-style placeholders — replace in your staging project if needed)
-- regular_user@test.octa  → wallet 0x0000000000000000000000000000000000000a01
-- admin@test.com          → wallet 0x0000000000000000000000000000000000000ad1
-- near_cap@test.octa      → wallet 0x0000000000000000000000000000000000000a02

-- Simulate 4,999 sold plots for RES-5000 / EXP-GATE scenarios (service role):
-- SELECT public.staging_simulate_plots_sold(4999);
-- SELECT public.staging_simulate_plots_sold(10000);

COMMENT ON TABLE public.platform_runtime_config IS
  'Octa Investment Group staging flags. environment=staging enables staging_simulate_plots_sold().';
