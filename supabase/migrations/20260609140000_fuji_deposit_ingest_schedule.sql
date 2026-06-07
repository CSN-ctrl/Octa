-- Fuji (AVAX) on-chain deposit ingestion schedule + service-role helper RPC.
--
-- 1. record_onchain_deposit_service – SECURITY DEFINER function callable only
--    by service role; resolves user email from ownership_registry and inserts
--    into onchain_deposits with ON CONFLICT DO NOTHING idempotency.
--
-- 2. pg_cron job that fires ingest-fuji-deposits every minute.

-- ---------------------------------------------------------------------------
-- Service-role RPC for edge-function ingestion of AvaxSwappedForXbgl events
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_onchain_deposit_service(
  p_tx_hash       TEXT,
  p_wallet_address TEXT,
  p_chain_id      INTEGER,
  p_avax_amount   NUMERIC,
  p_xbgl_amount   NUMERIC
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

  -- Resolve user email from ownership_registry (table may not exist in all envs).
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ownership_registry'
  ) THEN
    SELECT lower(o.email)
    INTO v_email
    FROM public.ownership_registry o
    WHERE lower(o.wallet_address) = v_wallet
    LIMIT 1;
  END IF;

  -- Fallback: store wallet address as identifier so NOT NULL constraint is met.
  v_email := COALESCE(NULLIF(trim(v_email), ''), 'wallet:' || v_wallet);

  -- Idempotent insert: ON CONFLICT DO NOTHING handles both duplicate calls and
  -- concurrent invocations for the same tx_hash.
  INSERT INTO public.onchain_deposits (
    user_id,
    user_email,
    wallet_address,
    chain_id,
    tx_hash,
    avax_amount,
    xbgl_amount
  ) VALUES (
    NULL,       -- user_id resolved lazily; column is nullable
    v_email,
    v_wallet,
    p_chain_id,
    v_hash,
    p_avax_amount,
    p_xbgl_amount
  )
  ON CONFLICT (tx_hash) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count = 0 THEN
    -- Row already existed – return stable duplicate signal for idempotent callers.
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  RETURN jsonb_build_object(
    'success',    true,
    'duplicate',  false,
    'user_email', v_email
  );
END;
$$;

-- Only the postgres/service role can invoke this function.
-- authenticated and anon must NOT have access.
REVOKE ALL ON FUNCTION public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC)
  FROM authenticated;
REVOKE ALL ON FUNCTION public.record_onchain_deposit_service(TEXT, TEXT, INTEGER, NUMERIC, NUMERIC)
  FROM anon;

-- ---------------------------------------------------------------------------
-- pg_cron schedule – runs every minute, mirrors USDC ingest pattern
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'ingest_fuji_deposits_every_minute'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'ingest_fuji_deposits_every_minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-fuji-deposits',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
