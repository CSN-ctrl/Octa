-- =============================================================================
-- 20260610130000 – Onchain deposit credit job (confirmed → credited)
-- =============================================================================
-- Fuji AVAX→xBGL swaps deliver xBGL on-chain; this job finalises server-side
-- tracking: backfill user_id, emit deposit_credited analytics, set status.
-- Idempotent: safe to re-run on the same tx_hash.
-- =============================================================================

-- Helper: resolve auth.users.id from deposit email / wallet linkage.
CREATE OR REPLACE FUNCTION public.resolve_onchain_deposit_user_id(
  p_user_email    TEXT,
  p_wallet_address TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email  TEXT := lower(trim(p_user_email));
  v_wallet TEXT := lower(trim(p_wallet_address));
  v_uid    UUID;
BEGIN
  -- Direct email match (skip synthetic wallet: prefix identifiers).
  IF v_email IS NOT NULL AND v_email <> '' AND v_email NOT LIKE 'wallet:%' THEN
    SELECT u.id INTO v_uid
    FROM   auth.users u
    WHERE  lower(u.email) = v_email
    LIMIT  1;
    IF v_uid IS NOT NULL THEN
      RETURN v_uid;
    END IF;
  END IF;

  -- ownership_registry email → auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ownership_registry'
  ) THEN
    SELECT u.id INTO v_uid
    FROM   public.ownership_registry o
    JOIN   auth.users u ON lower(u.email) = lower(o.email)
    WHERE  lower(o.wallet_address) = v_wallet
    LIMIT  1;
    IF v_uid IS NOT NULL THEN
      RETURN v_uid;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_onchain_deposit_user_id(TEXT, TEXT) FROM PUBLIC;


-- Single-tx credit: confirmed → credited + analytics event.
CREATE OR REPLACE FUNCTION public.credit_onchain_deposit(
  p_tx_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash TEXT := lower(trim(p_tx_hash));
  v_row  RECORD;
  v_uid  UUID;
  v_rows INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_dashboard_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'tx_hash required');
  END IF;

  SELECT *
  INTO   v_row
  FROM   public.onchain_deposits
  WHERE  tx_hash = v_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'deposit not found');
  END IF;

  IF v_row.status = 'credited' THEN
    RETURN jsonb_build_object('success', true, 'status', 'credited', 'note', 'already credited');
  END IF;

  IF v_row.status <> 'confirmed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'deposit not confirmed',
      'status',  v_row.status
    );
  END IF;

  v_uid := COALESCE(v_row.user_id, public.resolve_onchain_deposit_user_id(v_row.user_email, v_row.wallet_address));

  IF v_uid IS NOT NULL AND v_row.user_id IS NULL THEN
    UPDATE public.onchain_deposits
    SET    user_id = v_uid
    WHERE  id = v_row.id;
  END IF;

  -- Idempotent analytics: skip if same tx_hash already logged for this user.
  IF v_uid IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM   public.product_analytics_events e
    WHERE  e.user_id = v_uid
      AND  e.event_name = 'deposit_credited'
      AND  lower(e.properties ->> 'tx_hash') = v_hash
  ) THEN
    INSERT INTO public.product_analytics_events (user_id, event_name, properties)
    VALUES (
      v_uid,
      'deposit_credited',
      jsonb_build_object(
        'tx_hash',      v_hash,
        'xbgl',         v_row.xbgl_amount,
        'avax',         v_row.avax_amount,
        'chain_id',     v_row.chain_id,
        'source',       'indexer_credit_job',
        'wallet_address', v_row.wallet_address
      )
    );
  END IF;

  UPDATE public.onchain_deposits
  SET    status = 'credited'
  WHERE  id     = v_row.id
    AND  status = 'confirmed';

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  RETURN jsonb_build_object(
    'success',      true,
    'tx_hash',      v_hash,
    'status',       'credited',
    'user_id',      v_uid,
    'transitioned', v_rows > 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_onchain_deposit(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_onchain_deposit(TEXT) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_onchain_deposit(TEXT) TO service_role;


-- Batch processor for ingest cron tail.
CREATE OR REPLACE FUNCTION public.credit_confirmed_onchain_deposits(
  p_batch_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row   RECORD;
  v_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_batch_limit, 50), 200));
  v_ok    INTEGER := 0;
  v_skip  INTEGER := 0;
  v_fail  INTEGER := 0;
  v_res   JSONB;
BEGIN
  FOR v_row IN
    SELECT tx_hash
    FROM   public.onchain_deposits
    WHERE  status = 'confirmed'
    ORDER  BY created_at ASC
    LIMIT  v_limit
  LOOP
    v_res := public.credit_onchain_deposit(v_row.tx_hash);
    IF (v_res ->> 'success')::boolean THEN
      v_ok := v_ok + 1;
    ELSIF v_res ->> 'note' = 'already credited' THEN
      v_skip := v_skip + 1;
    ELSE
      v_fail := v_fail + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success',  true,
    'credited', v_ok,
    'skipped',  v_skip,
    'failed',   v_fail
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_confirmed_onchain_deposits(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_confirmed_onchain_deposits(INTEGER) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.credit_confirmed_onchain_deposits(INTEGER) TO service_role;


-- Backfill user_id in record_onchain_deposit_service on insert.
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
  v_uid    UUID;
  v_count  INTEGER;
BEGIN
  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid tx hash');
  END IF;
  IF p_avax_amount IS NULL OR p_avax_amount <= 0
     OR p_xbgl_amount IS NULL OR p_xbgl_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid amounts');
  END IF;

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

  v_email := COALESCE(NULLIF(trim(v_email), ''), 'wallet:' || v_wallet);
  v_uid   := public.resolve_onchain_deposit_user_id(v_email, v_wallet);

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
    v_uid,
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
    'user_id',    v_uid,
    'status',     'pending'
  );
END;
$$;


-- Legacy rows: client-recorded deposits with user_id are already on-chain credited.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'onchain_deposits'
      AND column_name  = 'status'
  ) THEN
    UPDATE public.onchain_deposits
    SET    status = 'credited'
    WHERE  status = 'pending'
      AND  user_id IS NOT NULL
      AND  block_number IS NULL;
  END IF;
END $$;
