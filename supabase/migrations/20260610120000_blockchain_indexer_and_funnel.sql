-- =============================================================================
-- 20260610120000 – Blockchain indexer infrastructure + funnel dashboard
-- =============================================================================
-- Scope:
--   P0-a  N-confirmation gate columns on onchain_deposits
--   P0-b  record_onchain_deposit_service – extended with block_number param
--   P0-c  confirm_onchain_deposit RPC (service-role helper)
--   P0-d  chain_plot_holdings cache table
--   P0-e  sync_chain_plot_ownership – also upserts chain_plot_holdings
--   P2-a  v_phase1_funnel_daily view (date × funnel-stage counts)
--   P2-b  v_phase1_activation_rate view (cohort signup → plot_purchased)
--   CRON  ingest-fuji-land-transfers (mirrors fuji deposit cron)
--
-- Idempotency: ADD COLUMN IF NOT EXISTS; CREATE INDEX IF NOT EXISTS;
--   OR REPLACE views; DO-block CHECK constraint guard; cron upsert via
--   unschedule-then-schedule pattern. Functions are dropped by old signature
--   then recreated under the new (extended) signature within the same txn.
--
-- Rollback plan:
--   DROP VIEW  public.v_phase1_funnel_daily;
--   DROP VIEW  public.v_phase1_activation_rate;
--   DROP TABLE public.chain_plot_holdings CASCADE;
--   DROP FUNCTION public.confirm_onchain_deposit(TEXT, INTEGER);
--   DROP FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT, INTEGER);
--   DROP FUNCTION public.record_onchain_deposit_service(TEXT,TEXT,INT,NUMERIC,NUMERIC,INT,INT);
--   SELECT cron.unschedule('ingest_fuji_land_transfers_every_minute');
--   ALTER TABLE public.onchain_deposits
--     DROP COLUMN IF EXISTS block_number,
--     DROP COLUMN IF EXISTS confirmations_required,
--     DROP COLUMN IF EXISTS status;
--   (Re-apply 20260609130000 and 20260609140000 to restore old function versions.)
-- =============================================================================


-- ===========================================================================
-- P0-a  N-confirmation gate columns on onchain_deposits
-- ===========================================================================
-- block_number:          chain height at which the tx was first observed.
-- confirmations_required: blocks required before the deposit is safe to credit
--                          (default 3; can be overridden per-chain at ingest time).
-- status:                monotonic lifecycle: pending → confirmed → credited.
--   pending   – tx seen but chain depth not yet sufficient.
--   confirmed – confirmation threshold met; safe to mint/credit xBGL.
--   credited  – xBGL has been transferred to the user's balance.
ALTER TABLE public.onchain_deposits
  ADD COLUMN IF NOT EXISTS block_number            INTEGER,
  ADD COLUMN IF NOT EXISTS confirmations_required  INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS status                  TEXT    NOT NULL DEFAULT 'pending';

-- Idempotent CHECK constraint (named constraint cannot be double-added).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema    = 'public'
      AND table_name      = 'onchain_deposits'
      AND constraint_name = 'onchain_deposits_status_check'
  ) THEN
    ALTER TABLE public.onchain_deposits
      ADD CONSTRAINT onchain_deposits_status_check
      CHECK (status IN ('pending', 'confirmed', 'credited'));
  END IF;
END $$;

-- Selective index: status filter is the main access pattern for the credit job.
CREATE INDEX IF NOT EXISTS idx_onchain_deposits_status
  ON public.onchain_deposits (status, created_at DESC);


-- ===========================================================================
-- P0-b  record_onchain_deposit_service – extended signature
-- ===========================================================================
-- Adds two optional parameters so the calling edge function can pass chain
-- context at ingest time.  The old 5-arg overload is dropped first so this
-- becomes a replacement rather than a second overload.
--
-- Design decision on status:
--   This function always inserts with status = 'pending'.  Two patterns work:
--   (A) Edge function waits for N confirmations on-chain, THEN calls this →
--       immediately call confirm_onchain_deposit(tx_hash, confirmations) to
--       transition to 'confirmed' in the same request cycle.
--   (B) Edge function calls this on first sight, then polls with
--       confirm_onchain_deposit once depth is reached.
--   Either pattern is safe; the credit job must only process 'confirmed' rows.
--
-- Idempotency: ON CONFLICT (tx_hash) DO NOTHING.

DROP FUNCTION IF EXISTS public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION public.record_onchain_deposit_service(
  p_tx_hash                TEXT,
  p_wallet_address         TEXT,
  p_chain_id               INTEGER,
  p_avax_amount            NUMERIC,
  p_xbgl_amount            NUMERIC,
  p_block_number           INTEGER DEFAULT NULL,
  p_confirmations_required INTEGER DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash   TEXT    := lower(trim(p_tx_hash));
  v_wallet TEXT    := lower(trim(p_wallet_address));
  v_email  TEXT;
  v_count  INTEGER;
BEGIN
  -- Input validation
  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid tx hash');
  END IF;
  IF p_avax_amount IS NULL OR p_avax_amount <= 0
     OR p_xbgl_amount IS NULL OR p_xbgl_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amounts');
  END IF;

  -- Resolve user email from ownership_registry (table may be absent in dev envs).
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ownership_registry'
  ) THEN
    SELECT lower(o.email)
    INTO   v_email
    FROM   public.ownership_registry o
    WHERE  lower(o.wallet_address) = v_wallet
    LIMIT  1;
  END IF;

  -- Fallback identifier keeps user_email NOT NULL constraint satisfied.
  v_email := COALESCE(NULLIF(trim(v_email), ''), 'wallet:' || v_wallet);

  -- Idempotent insert – duplicate tx_hash is a safe no-op.
  INSERT INTO public.onchain_deposits (
    user_id,
    user_email,
    wallet_address,
    chain_id,
    tx_hash,
    avax_amount,
    xbgl_amount,
    block_number,
    confirmations_required,
    status
  ) VALUES (
    NULL,
    v_email,
    v_wallet,
    p_chain_id,
    v_hash,
    p_avax_amount,
    p_xbgl_amount,
    p_block_number,
    COALESCE(p_confirmations_required, 3),
    'pending'
  )
  ON CONFLICT (tx_hash) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  RETURN jsonb_build_object(
    'success',    true,
    'duplicate',  false,
    'user_email', v_email,
    'status',     'pending'
  );
END;
$$;

-- Only the postgres / service role may invoke this function.
REVOKE ALL ON FUNCTION public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, INTEGER, INTEGER)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, INTEGER, INTEGER)
  FROM authenticated;
REVOKE ALL ON FUNCTION public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, INTEGER, INTEGER)
  FROM anon;


-- ===========================================================================
-- P0-c  confirm_onchain_deposit – optional state-machine helper
-- ===========================================================================
-- Transitions a deposit from pending → confirmed once the caller has observed
-- p_current_confirmations ≥ the deposit's confirmations_required threshold.
--
-- Idempotency:
--   • Calling on an already-confirmed or already-credited row is a safe no-op.
--   • The UPDATE is conditional on status = 'pending', preventing backward
--     transitions and race-condition double-confirms.
--
-- Auth model:
--   • service_role (auth.uid() IS NULL)  → allowed
--   • dashboard admin (authenticated)   → allowed via is_dashboard_admin()
--   • all other authenticated users     → forbidden (403)
--   • anon                              → no EXECUTE grant

CREATE OR REPLACE FUNCTION public.confirm_onchain_deposit(
  p_tx_hash               TEXT,
  p_current_confirmations INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT   := lower(trim(p_tx_hash));
  v_row  RECORD;
  v_rows INTEGER;
BEGIN
  -- Auth gate: service_role passes (auth.uid() IS NULL); admins pass via check.
  IF auth.uid() IS NOT NULL AND NOT public.is_dashboard_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'tx_hash required');
  END IF;

  SELECT id, status, confirmations_required
  INTO   v_row
  FROM   public.onchain_deposits
  WHERE  tx_hash = v_hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'deposit not found');
  END IF;

  -- Idempotent: already in a downstream state.
  IF v_row.status IN ('confirmed', 'credited') THEN
    RETURN jsonb_build_object(
      'success', true,
      'status',  v_row.status,
      'note',    'already ' || v_row.status
    );
  END IF;

  -- Threshold guard.
  IF p_current_confirmations < v_row.confirmations_required THEN
    RETURN jsonb_build_object(
      'success',                false,
      'error',                  'confirmation threshold not met',
      'current_confirmations',  p_current_confirmations,
      'required_confirmations', v_row.confirmations_required
    );
  END IF;

  -- Monotonic transition: only move pending → confirmed; skip if already moved.
  UPDATE public.onchain_deposits
  SET    status = 'confirmed'
  WHERE  id     = v_row.id
    AND  status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN jsonb_build_object(
    'success',      true,
    'tx_hash',      v_hash,
    'status',       'confirmed',
    'transitioned', v_rows > 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_onchain_deposit(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_onchain_deposit(TEXT, INTEGER) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.confirm_onchain_deposit(TEXT, INTEGER) TO service_role;


-- ===========================================================================
-- P0-d  chain_plot_holdings – onchain ownership cache
-- ===========================================================================
-- Source of truth: Avalanche Fuji chain (PlotTransferred events).
-- This table caches the last confirmed plot ownership per plot_id so the
-- application can serve ownership queries without live RPC calls.
--
-- Sync direction: onchain → chain_plot_holdings (via sync_chain_plot_ownership)
--                         → plots.owner_wallet (secondary mirror).
-- Conflict policy: chain-wins.  A stale-event block-number guard in the sync
--   RPC prevents older events from overwriting more recent state.
-- Access: public read (same as plots); write is service_role only via the RPC.

CREATE TABLE IF NOT EXISTS public.chain_plot_holdings (
  plot_id      INT         PRIMARY KEY REFERENCES public.plots(id) ON DELETE CASCADE,
  owner_wallet TEXT        NOT NULL,
  tx_hash      TEXT        NOT NULL,
  block_number INT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ownership lookup by wallet (indexer reconciliation + UI queries).
CREATE INDEX IF NOT EXISTS idx_chain_plot_holdings_wallet
  ON public.chain_plot_holdings (lower(owner_wallet));

ALTER TABLE public.chain_plot_holdings ENABLE ROW LEVEL SECURITY;

-- Public read: plot ownership is not sensitive information.
DROP POLICY IF EXISTS chain_plot_holdings_select_all ON public.chain_plot_holdings;
CREATE POLICY chain_plot_holdings_select_all ON public.chain_plot_holdings
  FOR SELECT TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies: deny-by-default for all client roles.
-- Only the service_role (via sync_chain_plot_ownership) writes this table.
GRANT SELECT ON public.chain_plot_holdings TO anon, authenticated;


-- ===========================================================================
-- P0-e  sync_chain_plot_ownership – upserts chain_plot_holdings + plots
-- ===========================================================================
-- Extended vs 20260609130000:
--   • Adds p_block_number INTEGER DEFAULT NULL.
--   • Upserts into chain_plot_holdings (new cache) in addition to plots.
--   • Stale-event guard: if the cached block_number is already higher than the
--     incoming event's block_number, the update is skipped silently.
--
-- The old 3-arg signature is dropped first so this is a clean replacement.
-- Existing callers (edge functions using service_role key) that pass 3 args
-- will work unchanged because p_block_number has a DEFAULT.

DROP FUNCTION IF EXISTS public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.sync_chain_plot_ownership(
  p_plot_id      INTEGER,
  p_owner_wallet TEXT,
  p_tx_hash      TEXT,
  p_block_number INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet      TEXT    := lower(trim(p_owner_wallet));
  v_hash        TEXT    := lower(trim(p_tx_hash));
  v_rows        INTEGER;
  v_cache_block INT;
BEGIN
  -- Auth gate: service_role or dashboard admin only.
  IF auth.uid() IS NOT NULL AND NOT public.is_dashboard_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- Input validation.
  IF p_plot_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_id required');
  END IF;
  IF v_wallet IS NULL OR v_wallet = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'owner_wallet required');
  END IF;
  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'tx_hash required');
  END IF;

  -- Stale-event guard: block numbers must be monotonically increasing.
  -- If the cache already reflects a more recent block, skip silently.
  SELECT block_number
  INTO   v_cache_block
  FROM   public.chain_plot_holdings
  WHERE  plot_id = p_plot_id;

  IF v_cache_block IS NOT NULL
     AND p_block_number IS NOT NULL
     AND v_cache_block > p_block_number THEN
    RETURN jsonb_build_object(
      'success',      true,
      'note',         'stale event skipped',
      'cached_block', v_cache_block,
      'event_block',  p_block_number
    );
  END IF;

  -- Mirror to plots.owner_wallet (secondary copy for RLS-checked queries).
  UPDATE public.plots
  SET    owner_wallet = v_wallet,
         updated_at   = NOW()
  WHERE  id = p_plot_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'plot not found',
      'plot_id', p_plot_id
    );
  END IF;

  -- Upsert chain_plot_holdings (authoritative cache, chain-wins).
  INSERT INTO public.chain_plot_holdings (
    plot_id, owner_wallet, tx_hash, block_number, updated_at
  ) VALUES (
    p_plot_id, v_wallet, v_hash, p_block_number, NOW()
  )
  ON CONFLICT (plot_id) DO UPDATE
    SET owner_wallet = EXCLUDED.owner_wallet,
        tx_hash      = EXCLUDED.tx_hash,
        block_number = EXCLUDED.block_number,
        updated_at   = NOW();

  RETURN jsonb_build_object(
    'success',      true,
    'plot_id',      p_plot_id,
    'new_wallet',   v_wallet,
    'tx_hash',      v_hash,
    'block_number', p_block_number
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT, INTEGER) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT, INTEGER) TO service_role;


-- ===========================================================================
-- P2-prereq  product_analytics_events – ensure prerequisite table exists
-- ===========================================================================
-- This table was introduced in 20260609120000 but may not be present on all
-- environments. Created here with IF NOT EXISTS so the view definitions below
-- are always satisfied regardless of prior migration state.

CREATE TABLE IF NOT EXISTS public.product_analytics_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT        NOT NULL,
  properties JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_analytics_events_name_created
  ON public.product_analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_analytics_events_user
  ON public.product_analytics_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.product_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_analytics_events_insert_own ON public.product_analytics_events;
CREATE POLICY product_analytics_events_insert_own ON public.product_analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS product_analytics_events_select_admin ON public.product_analytics_events;
CREATE POLICY product_analytics_events_select_admin ON public.product_analytics_events
  FOR SELECT TO authenticated
  USING (public.is_dashboard_admin());

GRANT INSERT ON public.product_analytics_events TO authenticated;
GRANT SELECT ON public.product_analytics_events TO authenticated;


-- ===========================================================================
-- P2-a  v_phase1_funnel_daily – per-day funnel stage counts
-- ===========================================================================
-- Aggregates unique user counts per funnel stage per UTC calendar day.
-- Access: admin-only (enforced by RLS on product_analytics_events; non-admins
-- will receive 0 rows, not an error).
--
-- Expected event_name values emitted by client/edge code:
--   signup | wallet_connected | deposit_initiated | deposit_credited |
--   plot_purchased | certificate_viewed
--
-- All timestamps normalised to UTC before truncating to day.

CREATE OR REPLACE VIEW public.v_phase1_funnel_daily AS
SELECT
  (date_trunc('day', e.created_at AT TIME ZONE 'UTC'))::DATE            AS date,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'signup')             AS signups,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'wallet_connected')   AS wallet_connected,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'deposit_initiated')  AS deposit_initiated,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'deposit_credited')   AS deposit_credited,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'plot_purchased')     AS plot_purchased,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'certificate_viewed') AS certificate_viewed
FROM public.product_analytics_events e
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.v_phase1_funnel_daily TO authenticated;


-- ===========================================================================
-- P2-b  v_phase1_activation_rate – signup-to-purchase cohort conversion
-- ===========================================================================
-- Cohort = users who emitted a 'signup' event on a given UTC day.
-- Conversion = users in that cohort who also emitted 'plot_purchased' (any time).
-- conversion_rate_pct is 0 when signups = 0 (safe division guard).
-- Access: admin-only (same RLS inheritance as v_phase1_funnel_daily).

CREATE OR REPLACE VIEW public.v_phase1_activation_rate AS
WITH signup_cohorts AS (
  SELECT
    (date_trunc('day', created_at AT TIME ZONE 'UTC'))::DATE AS cohort_date,
    user_id
  FROM  public.product_analytics_events
  WHERE event_name = 'signup'
    AND user_id IS NOT NULL
),
purchasers AS (
  SELECT DISTINCT user_id
  FROM  public.product_analytics_events
  WHERE event_name = 'plot_purchased'
    AND user_id IS NOT NULL
)
SELECT
  sc.cohort_date,
  COUNT(DISTINCT sc.user_id)                                            AS signups,
  COUNT(DISTINCT p.user_id)                                             AS converted,
  CASE
    WHEN COUNT(DISTINCT sc.user_id) > 0
    THEN ROUND(
      COUNT(DISTINCT p.user_id)::NUMERIC
        / COUNT(DISTINCT sc.user_id)::NUMERIC * 100,
      2
    )
    ELSE 0
  END                                                                   AS conversion_rate_pct
FROM  signup_cohorts sc
LEFT JOIN purchasers p ON sc.user_id = p.user_id
GROUP BY sc.cohort_date
ORDER BY sc.cohort_date DESC;

GRANT SELECT ON public.v_phase1_activation_rate TO authenticated;


-- ===========================================================================
-- CRON  ingest-fuji-land-transfers – mirrors fuji deposit ingest schedule
-- ===========================================================================
-- Fires every minute via pg_net HTTP POST to the edge function that processes
-- PlotTransferred events from the Avalanche Fuji chain.
-- Pattern mirrors the ingest_fuji_deposits_every_minute job in 20260609140000.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid INTO v_job_id
  FROM   cron.job
  WHERE  jobname = 'ingest_fuji_land_transfers_every_minute'
  LIMIT  1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'ingest_fuji_land_transfers_every_minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-fuji-land-transfers',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
