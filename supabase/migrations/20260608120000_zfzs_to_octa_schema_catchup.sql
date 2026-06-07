-- Catch-up schema on octa (agqkiwarwxrcemhspxxv) for tables that exist on Sarakt-final (zfzs).

-- -----------------------------------------------------------------------------
-- USDC deposit stack
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_token TEXT NOT NULL,
  to_token TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (from_token, to_token)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_tokens ON public.exchange_rates (from_token, to_token);

INSERT INTO public.exchange_rates (from_token, to_token, rate)
VALUES ('EUR', 'xBGL', 1.955833), ('EUR', 'USDC', 1.1)
ON CONFLICT (from_token, to_token) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.hot_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usdc_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_wallet TEXT,
  network_id TEXT NOT NULL,
  usdc_amount NUMERIC NOT NULL,
  xbgl_amount NUMERIC NOT NULL,
  tx_hash TEXT,
  hot_wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_usdc_deposits_user_email ON public.usdc_deposits (user_email);
CREATE INDEX IF NOT EXISTS idx_usdc_deposits_tx_hash ON public.usdc_deposits (tx_hash);
CREATE INDEX IF NOT EXISTS idx_usdc_deposits_status ON public.usdc_deposits (status);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hot_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdc_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mvp_read_exchange_rates ON public.exchange_rates;
CREATE POLICY mvp_read_exchange_rates ON public.exchange_rates
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS usdc_deposits_select_own ON public.usdc_deposits;
CREATE POLICY usdc_deposits_select_own ON public.usdc_deposits
  FOR SELECT TO authenticated
  USING (lower(user_email) = lower(auth.jwt() ->> 'email') OR public.is_dashboard_admin());

DROP POLICY IF EXISTS usdc_deposits_insert_own ON public.usdc_deposits;
CREATE POLICY usdc_deposits_insert_own ON public.usdc_deposits
  FOR INSERT TO authenticated
  WITH CHECK (lower(user_email) = lower(auth.jwt() ->> 'email'));

-- -----------------------------------------------------------------------------
-- ILO / genesis (ilo_participants = "the_participants" in dashboard visualizer)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ilo_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_spots INTEGER NOT NULL DEFAULT 10000,
  spots_taken INTEGER NOT NULL DEFAULT 0,
  total_raised_usdc NUMERIC NOT NULL DEFAULT 0,
  total_raised_eur NUMERIC NOT NULL DEFAULT 0,
  participants_count INTEGER NOT NULL DEFAULT 0,
  campaign_start_date TIMESTAMPTZ DEFAULT NOW(),
  campaign_end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.ilo_stats (
  total_spots, spots_taken, total_raised_usdc, total_raised_eur, participants_count, is_active
) SELECT 10000, 0, 0, 0, 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.ilo_stats WHERE is_active = true);

CREATE TABLE IF NOT EXISTS public.ilo_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT,
  plot_id INTEGER REFERENCES public.plots(id) ON DELETE SET NULL,
  purchase_date TIMESTAMPTZ,
  participation_number INTEGER,
  phase_1_early_access BOOLEAN DEFAULT false,
  plot_purchased BOOLEAN DEFAULT false,
  eligible_for_btc BOOLEAN DEFAULT false,
  eligible_for_structure BOOLEAN DEFAULT false,
  received_structure BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.genesis_stats (
  id TEXT PRIMARY KEY,
  ilo_closed BOOLEAN DEFAULT false,
  secondary_market_active BOOLEAN DEFAULT false,
  total_participants INTEGER DEFAULT 0,
  eligible_for_btc INTEGER DEFAULT 0,
  eligible_for_structure INTEGER DEFAULT 0,
  structures_distributed INTEGER DEFAULT 0,
  btc_winner_selected BOOLEAN DEFAULT false,
  btc_winner_wallet TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.genesis_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  prize_value TEXT,
  awarded BOOLEAN DEFAULT false,
  awarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_media_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  verification_code TEXT,
  verified BOOLEAN DEFAULT false,
  verification_url TEXT,
  verified_at TIMESTAMPTZ,
  comment_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (wallet_address, platform, action_type)
);

ALTER TABLE public.ilo_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ilo_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genesis_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ilo_stats_public_read ON public.ilo_stats;
CREATE POLICY ilo_stats_public_read ON public.ilo_stats FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS ilo_participants_select_own ON public.ilo_participants;
CREATE POLICY ilo_participants_select_own ON public.ilo_participants
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower(auth.jwt() ->> 'email')
    OR lower(wallet_address) = public.current_auth_wallet()
    OR public.is_dashboard_admin()
  );

-- -----------------------------------------------------------------------------
-- User wallets + expert applications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_label TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_address ON public.user_wallets (wallet_address);
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_wallets_select_own ON public.user_wallets;
CREATE POLICY user_wallets_select_own ON public.user_wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_wallets_insert_own ON public.user_wallets;
CREATE POLICY user_wallets_insert_own ON public.user_wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  budget_range TEXT NOT NULL,
  investment_goals TEXT,
  preferred_contact TEXT DEFAULT 'email',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  assigned_consultant TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ
);

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Treasury ingest observability
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treasury_ingest_checkpoints (
  chain_id TEXT PRIMARY KEY,
  last_ingested_block BIGINT NOT NULL DEFAULT 0,
  last_ingested_at TIMESTAMPTZ,
  last_run_started_at TIMESTAMPTZ,
  last_run_completed_at TIMESTAMPTZ,
  last_run_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_run_status IN ('idle', 'running', 'ok', 'partial', 'error')),
  last_run_error TEXT,
  total_ingested_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.treasury_ingest_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id TEXT NOT NULL,
  source_tx_hash TEXT NOT NULL,
  source_unique_id TEXT,
  source_block_num BIGINT,
  error_message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retry_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_treasury_ingest_failures_chain_source_hash
  ON public.treasury_ingest_failures (lower(chain_id), lower(source_tx_hash));

-- -----------------------------------------------------------------------------
-- ILO stats RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_ilo_stats()
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
    s.total_spots,
    s.spots_taken,
    (s.total_spots - s.spots_taken) AS spots_remaining,
    s.total_raised_usdc,
    s.total_raised_eur,
    s.participants_count,
    CASE WHEN s.total_spots > 0
      THEN ROUND((s.spots_taken::NUMERIC / s.total_spots::NUMERIC) * 100, 2)
      ELSE 0
    END AS progress_percentage,
    s.is_active
  FROM public.ilo_stats s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ilo_stats() TO anon, authenticated;
