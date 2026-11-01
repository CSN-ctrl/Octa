-- ZeroTier authorize/deauthorize retry state (revoke in DB is immediate; ZT catches up async)

ALTER TABLE public.nodes
  ADD COLUMN IF NOT EXISTS zt_deauth_pending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zt_deauth_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zt_deauth_next_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zt_deauth_last_error TEXT,
  ADD COLUMN IF NOT EXISTS zt_authorize_pending BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zt_authorize_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zt_authorize_next_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zt_authorize_last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_nodes_zt_deauth_pending
  ON public.nodes (zt_deauth_next_attempt_at)
  WHERE zt_deauth_pending = true;

CREATE INDEX IF NOT EXISTS idx_nodes_zt_authorize_pending
  ON public.nodes (zt_authorize_next_attempt_at)
  WHERE zt_authorize_pending = true;

-- Join RPC: DB revoke/replace is authoritative; ZT deauth is handled post-commit in API
CREATE OR REPLACE FUNCTION public.complete_personal_node_join(
  p_wallet TEXT,
  p_challenge_id UUID,
  p_user_id UUID,
  p_zt_id TEXT,
  p_platform TEXT,
  p_app_version TEXT,
  p_replace_node_id UUID,
  p_pending_token_hash TEXT,
  p_pending_expires TIMESTAMPTZ,
  p_max_devices INTEGER,
  p_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.node_join_challenges%ROWTYPE;
  v_live_count INTEGER;
  v_old public.nodes%ROWTYPE;
  v_new_id UUID;
  v_join_id UUID;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  PERFORM public.wallet_advisory_lock(p_wallet);

  SELECT * INTO v_challenge
  FROM public.node_join_challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'challenge_not_found';
  END IF;

  IF v_challenge.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'challenge_consumed';
  END IF;

  IF v_challenge.expires_at < v_now THEN
    RAISE EXCEPTION 'challenge_expired';
  END IF;

  IF v_challenge.wallet_address <> lower(btrim(p_wallet)) THEN
    RAISE EXCEPTION 'wallet_mismatch';
  END IF;

  IF v_challenge.purpose <> 'join' THEN
    RAISE EXCEPTION 'invalid_purpose';
  END IF;

  IF p_replace_node_id IS DISTINCT FROM v_challenge.replace_node_id THEN
    RAISE EXCEPTION 'replace_mismatch';
  END IF;

  SELECT count(*)::INTEGER INTO v_live_count
  FROM public.nodes
  WHERE wallet_address = lower(btrim(p_wallet))
    AND status IN ('pending', 'approved');

  IF p_replace_node_id IS NOT NULL THEN
    SELECT * INTO v_old
    FROM public.nodes
    WHERE id = p_replace_node_id
      AND wallet_address = lower(btrim(p_wallet))
      AND status IN ('pending', 'approved')
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'replace_node_invalid';
    END IF;
  ELSIF v_live_count >= p_max_devices THEN
    RAISE EXCEPTION 'device_limit_reached';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.nodes
    WHERE zerotier_node_id = p_zt_id
      AND status IN ('pending', 'approved')
  ) THEN
    RAISE EXCEPTION 'zerotier_node_id_in_use';
  END IF;

  INSERT INTO public.nodes (
    owner_user_id,
    wallet_address,
    zerotier_node_id,
    platform,
    app_version,
    status,
    pending_token_hash,
    pending_token_expires_at
  ) VALUES (
    p_user_id,
    lower(btrim(p_wallet)),
    p_zt_id,
    p_platform,
    coalesce(p_app_version, ''),
    'pending',
    p_pending_token_hash,
    p_pending_expires
  )
  RETURNING id INTO v_new_id;

  IF p_replace_node_id IS NOT NULL THEN
    UPDATE public.nodes
    SET
      status = 'revoked',
      reason = 'replaced_by_new_device',
      replaced_by_node_id = v_new_id,
      pending_token_hash = NULL,
      updated_at = v_now
    WHERE id = p_replace_node_id;

    INSERT INTO public.node_events (node_id, event_type, detail)
    VALUES (
      p_replace_node_id,
      'replaced',
      jsonb_build_object('replaced_by_node_id', v_new_id)
    );

    INSERT INTO public.node_events (node_id, event_type, detail)
    VALUES (
      p_replace_node_id,
      'revoked',
      jsonb_build_object('reason', 'replaced_by_new_device', 'replaced_by_node_id', v_new_id)
    );
  END IF;

  INSERT INTO public.node_join_requests (
    user_id,
    wallet_address,
    zerotier_node_id,
    platform,
    app_version,
    challenge_id,
    signature,
    status,
    node_id
  ) VALUES (
    p_user_id,
    lower(btrim(p_wallet)),
    p_zt_id,
    p_platform,
    coalesce(p_app_version, ''),
    p_challenge_id,
    p_signature,
    'pending',
    v_new_id
  )
  RETURNING id INTO v_join_id;

  INSERT INTO public.node_events (node_id, event_type, detail)
  VALUES (
    v_new_id,
    'joined',
    jsonb_build_object(
      'wallet_address', lower(btrim(p_wallet)),
      'zerotier_node_id', p_zt_id,
      'platform', p_platform,
      'replaced_node_id', p_replace_node_id
    )
  );

  UPDATE public.node_join_challenges
  SET consumed_at = v_now
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'node_id', v_new_id,
    'join_request_id', v_join_id,
    'replaced_node_id', p_replace_node_id
  );
END;
$$;

DROP FUNCTION IF EXISTS public.complete_personal_node_join(
  TEXT, UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ, INTEGER, BOOLEAN, TEXT, TEXT
);

REVOKE ALL ON FUNCTION public.complete_personal_node_join(
  TEXT, UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_personal_node_join(
  TEXT, UUID, UUID, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ, INTEGER, TEXT
) TO service_role;
