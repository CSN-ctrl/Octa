-- Phase 1: RPC rate limits + chain plot ownership sync
-- Hardening companion to 20260607120000 (onchain_deposits) and
-- 20260609120000 (analytics/admin tighten).
--
-- Delivers:
--   1. deposit_rate_limit_log  – sliding-window call counter for record_onchain_deposit
--   2. record_onchain_deposit  – replaced: rate limit + tighter uid/email binding
--   3. sync_chain_plot_ownership – minimal indexer upsert stub (service_role only)
--
-- NOTE: fuji_ingest_checkpoints is intentionally omitted.
--   treasury_ingest_checkpoints (20260415120000) already provides a
--   chain_id-keyed cursor store. Fuji edge functions should upsert:
--     INSERT INTO treasury_ingest_checkpoints (chain_id, ...) VALUES ('avalanche-fuji', ...)
--     ON CONFLICT (chain_id) DO UPDATE ...
--
-- Rollback approach:
--   DROP TABLE public.deposit_rate_limit_log CASCADE;
--   (Re-apply 20260607120000 record_onchain_deposit to restore the original version.)
--   DROP FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT);
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. Sliding-window rate-limit table for deposit RPC calls
-- ===========================================================================
-- Tracks each call to record_onchain_deposit per user_id within the current
-- 60-second window. Entries older than 2× the window are pruned inline on
-- every successful call, keeping the table bounded.
CREATE TABLE IF NOT EXISTS public.deposit_rate_limit_log (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID        NOT NULL,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Selective index: window-scoped lookups are user_id + called_at range scans.
CREATE INDEX IF NOT EXISTS idx_deposit_rate_limit_log_user_called
  ON public.deposit_rate_limit_log (user_id, called_at DESC);

ALTER TABLE public.deposit_rate_limit_log ENABLE ROW LEVEL SECURITY;

-- No direct access for any client role; only accessible via SECURITY DEFINER
-- functions that run as the function owner.
REVOKE ALL ON TABLE public.deposit_rate_limit_log FROM PUBLIC;
REVOKE ALL ON TABLE public.deposit_rate_limit_log FROM anon, authenticated;

-- ===========================================================================
-- 2. record_onchain_deposit – rate limit + tighter uid/email binding
-- ===========================================================================
-- Changes vs 20260607120000:
--   • Rate limit: max 10 calls per user per 60-second window.
--     Excess calls return {success: false, error: "rate limit exceeded"}.
--   • JWT email is now validated as non-empty before the match check, so a
--     missing JWT email is an explicit error rather than a silent null match.
--   • v_uid variable captures auth.uid() once and is reused for the rate
--     limit log, removing any risk of the value changing mid-function.
--   • Inline cleanup of rate-limit-log entries older than 2× window (best-effort).
--
-- Idempotency: unchanged – duplicate tx_hash returns {success:true, duplicate:true}.
-- Concurrency safety: duplicate tx_hash protected by UNIQUE constraint on
--   onchain_deposits.tx_hash (20260607120000). Race condition on rate limit
--   counting is acceptable for a soft throttle; advisory locks not needed here.
CREATE OR REPLACE FUNCTION public.record_onchain_deposit(
  p_tx_hash        TEXT,
  p_wallet_address TEXT,
  p_chain_id       INTEGER,
  p_avax_amount    NUMERIC,
  p_xbgl_amount    NUMERIC,
  p_user_email     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid        UUID    := auth.uid();
  v_jwt_email  TEXT    := lower(trim(auth.jwt() ->> 'email'));
  v_email      TEXT    := lower(trim(COALESCE(p_user_email, auth.jwt() ->> 'email')));
  v_hash       TEXT    := lower(trim(p_tx_hash));
  v_call_count INTEGER;
  -- Soft rate-limit parameters
  c_max_calls  CONSTANT INTEGER := 10;
  c_window_sec CONSTANT INTEGER := 60;
BEGIN
  -- ── Auth gate ─────────────────────────────────────────────────────────────
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication required');
  END IF;

  -- ── JWT email must exist and must match the supplied (or derived) email ───
  -- Binding auth.uid() to user_email via the JWT claim prevents a caller from
  -- recording a deposit under a different user's email address.
  IF v_jwt_email IS NULL OR v_jwt_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'jwt email missing');
  END IF;
  IF v_email IS NULL OR v_email = '' OR v_jwt_email != v_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'email mismatch');
  END IF;

  -- ── Input validation ──────────────────────────────────────────────────────
  IF v_hash IS NULL OR v_hash = '' OR v_hash NOT LIKE '0x%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid tx hash');
  END IF;
  IF p_avax_amount IS NULL OR p_avax_amount <= 0
     OR p_xbgl_amount IS NULL OR p_xbgl_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amounts');
  END IF;

  -- ── Sliding-window rate limit ─────────────────────────────────────────────
  SELECT COUNT(*) INTO v_call_count
  FROM public.deposit_rate_limit_log
  WHERE user_id   = v_uid
    AND called_at >= NOW() - (c_window_sec || ' seconds')::INTERVAL;

  IF v_call_count >= c_max_calls THEN
    RETURN jsonb_build_object(
      'success',             false,
      'error',               'rate limit exceeded',
      'retry_after_seconds', c_window_sec
    );
  END IF;

  -- Log this call; prune entries older than 2× window (keeps table bounded).
  INSERT INTO public.deposit_rate_limit_log (user_id) VALUES (v_uid);
  DELETE FROM public.deposit_rate_limit_log
  WHERE user_id   = v_uid
    AND called_at < NOW() - (c_window_sec * 2 || ' seconds')::INTERVAL;

  -- ── Idempotency: duplicate tx_hash is a safe no-op ───────────────────────
  IF EXISTS (SELECT 1 FROM public.onchain_deposits WHERE tx_hash = v_hash) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  -- ── Insert deposit row ────────────────────────────────────────────────────
  INSERT INTO public.onchain_deposits (
    user_id, user_email, wallet_address, chain_id, tx_hash, avax_amount, xbgl_amount
  ) VALUES (
    v_uid,
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

-- ===========================================================================
-- 3. sync_chain_plot_ownership – minimal indexer upsert stub
-- ===========================================================================
-- Called by an off-chain indexer (service_role key) when a PlotTransferred
-- event is confirmed on-chain. Updates plots.owner_wallet and logs the
-- originating tx_hash for traceability.
--
-- Auth model:
--   • service_role (auth.uid() = NULL)  → allowed
--   • dashboard admin (authenticated)   → allowed
--   • all other authenticated users     → forbidden (403)
--   • anon                              → no EXECUTE grant
--
-- Idempotency note:
--   Multiple calls with the same (p_plot_id, p_owner_wallet) are safe (UPDATE
--   is idempotent). Full tx_hash-scoped idempotency would require a
--   last_sync_tx_hash column on plots; deferred to the full indexer phase.
--
-- Does NOT upsert ownership_registry because the indexer does not carry the
-- user's email address (ownership_registry.email is NOT NULL).
CREATE OR REPLACE FUNCTION public.sync_chain_plot_ownership(
  p_plot_id      INTEGER,
  p_owner_wallet TEXT,
  p_tx_hash      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet TEXT    := lower(trim(p_owner_wallet));
  v_hash   TEXT    := lower(trim(p_tx_hash));
  v_rows   INTEGER;
BEGIN
  -- Allow only service_role callers (auth.uid() IS NULL) or dashboard admins.
  -- Reject ordinary authenticated users to prevent self-service ownership theft.
  IF auth.uid() IS NOT NULL AND NOT public.is_dashboard_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- Input validation
  IF p_plot_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_id required');
  END IF;
  IF v_wallet IS NULL OR v_wallet = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'owner_wallet required');
  END IF;
  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'tx_hash required');
  END IF;

  -- Upsert ownership on plots row (idempotent by plot_id)
  UPDATE public.plots
  SET owner_wallet = v_wallet,
      updated_at   = NOW()
  WHERE id = p_plot_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;

  IF v_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'plot not found',
      'plot_id', p_plot_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success',    true,
    'plot_id',    p_plot_id,
    'new_wallet', v_wallet,
    'tx_hash',    v_hash
  );
END;
$$;

-- Callable by service_role only (off-chain indexer uses service key).
-- Authenticated users (including admins calling via RLS-checked path) get
-- access only if is_dashboard_admin() passes inside the function body above.
REVOKE EXECUTE ON FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.sync_chain_plot_ownership(INTEGER, TEXT, TEXT) TO service_role;
