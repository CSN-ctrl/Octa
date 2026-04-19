-- Admin replay surface for treasury ingest failures.
-- Provides explicit, auditable manual replay operations.

CREATE OR REPLACE VIEW public.admin_treasury_ingest_failures AS
SELECT
  f.id,
  lower(f.chain_id) AS chain_id,
  lower(f.source_tx_hash) AS source_tx_hash,
  f.source_unique_id,
  f.source_block_num,
  f.error_message,
  f.payload,
  f.retry_count,
  f.status,
  f.first_seen_at,
  f.last_seen_at,
  f.resolved_at
FROM public.treasury_ingest_failures f;

REVOKE ALL ON TABLE public.admin_treasury_ingest_failures FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_treasury_ingest_failures(
  p_status text DEFAULT 'open',
  p_chain_id text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS SETOF public.admin_treasury_ingest_failures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.admin_treasury_ingest_failures f
  WHERE (p_status IS NULL OR p_status = '' OR lower(f.status) = lower(p_status))
    AND (p_chain_id IS NULL OR p_chain_id = '' OR lower(f.chain_id) = lower(p_chain_id))
  ORDER BY f.last_seen_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_treasury_ingest_failure_for_replay(
  p_chain_id text,
  p_source_tx_hash text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_chain_id text := lower(trim(coalesce(p_chain_id, '')));
  v_source_tx_hash text := lower(trim(coalesce(p_source_tx_hash, '')));
  v_updated integer;
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_chain_id = '' OR v_source_tx_hash = '' THEN
    RAISE EXCEPTION 'missing chain or source tx hash';
  END IF;

  UPDATE public.treasury_ingest_failures
  SET
    status = 'open',
    resolved_at = NULL,
    last_seen_at = now(),
    error_message = coalesce(nullif(trim(p_note), ''), error_message)
  WHERE lower(chain_id) = v_chain_id
    AND lower(source_tx_hash) = v_source_tx_hash;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'failure row not found';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'action', 'marked_for_replay',
    'chain_id', v_chain_id,
    'source_tx_hash', v_source_tx_hash,
    'replay_payload', jsonb_build_object(
      'chain_id', v_chain_id,
      'replay_source_tx_hash', v_source_tx_hash
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_treasury_ingest_failure(
  p_chain_id text,
  p_source_tx_hash text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_chain_id text := lower(trim(coalesce(p_chain_id, '')));
  v_source_tx_hash text := lower(trim(coalesce(p_source_tx_hash, '')));
  v_updated integer;
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF v_chain_id = '' OR v_source_tx_hash = '' THEN
    RAISE EXCEPTION 'missing chain or source tx hash';
  END IF;

  UPDATE public.treasury_ingest_failures
  SET
    status = 'resolved',
    resolved_at = now(),
    last_seen_at = now(),
    error_message = coalesce(nullif(trim(p_note), ''), error_message)
  WHERE lower(chain_id) = v_chain_id
    AND lower(source_tx_hash) = v_source_tx_hash;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'failure row not found';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'action', 'resolved',
    'chain_id', v_chain_id,
    'source_tx_hash', v_source_tx_hash
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_treasury_ingest_failures(text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_treasury_ingest_failure_for_replay(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_treasury_ingest_failure(text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_treasury_ingest_failures(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_treasury_ingest_failure_for_replay(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_treasury_ingest_failure(text, text, text) TO authenticated;
