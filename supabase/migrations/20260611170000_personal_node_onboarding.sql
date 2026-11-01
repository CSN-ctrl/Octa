-- Personal Node onboarding (Octa Investment Group / Sarakt)
-- Reversible: drop policies/tables in reverse order if rolling back.

-- ---------------------------------------------------------------------------
-- Governance reviewer (dashboard admin OR user_metadata.role = network_governance)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_network_governance_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_dashboard_admin()
    OR (
      auth.uid() IS NOT NULL
      AND lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'network_governance'
    );
$$;

REVOKE ALL ON FUNCTION public.is_network_governance_reviewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_network_governance_reviewer() TO authenticated;

-- ---------------------------------------------------------------------------
-- node_join_challenges — single-use wallet join nonces (server-only via API)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.node_join_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  zerotier_node_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'join',
  app_version TEXT NOT NULL DEFAULT '',
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT node_join_challenges_wallet_lower CHECK (wallet_address = lower(btrim(wallet_address))),
  CONSTRAINT node_join_challenges_purpose_check CHECK (purpose IN ('join', 'lookup')),
  CONSTRAINT node_join_challenges_platform_check CHECK (platform IN ('android', 'web', 'desktop')),
  CONSTRAINT node_join_challenges_zerotier_id_format CHECK (zerotier_node_id ~ '^[0-9a-f]{10}$'),
  CONSTRAINT node_join_challenges_lookup_no_zt CHECK (
    purpose <> 'lookup' OR zerotier_node_id = '0000000000'
  ),
  CONSTRAINT node_join_challenges_join_zt CHECK (
    purpose <> 'join' OR zerotier_node_id <> '0000000000'
  ),
  CONSTRAINT node_join_challenges_nonce_unique UNIQUE (nonce)
);

CREATE INDEX IF NOT EXISTS idx_node_join_challenges_wallet_created
  ON public.node_join_challenges (wallet_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_node_join_challenges_expires
  ON public.node_join_challenges (expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.node_join_challenges ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- nodes — registered personal nodes (wallet-first; optional Supabase owner)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  zerotier_node_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  zt_authorized_at TIMESTAMPTZ,
  credential_hash TEXT,
  pending_token_hash TEXT,
  pending_token_expires_at TIMESTAMPTZ,
  pending_token_consumed_at TIMESTAMPTZ,
  credential_rotated_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  last_app_version TEXT,
  last_uptime_secs BIGINT,
  last_peers INTEGER,
  last_zerotier_online BOOLEAN,
  last_chain_height BIGINT,
  node_class TEXT NOT NULL DEFAULT 'light',
  avalanche_node_id TEXT,
  bls_public_key TEXT,
  bls_pop TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT nodes_node_class_check CHECK (node_class IN ('light', 'validator')),
  CONSTRAINT nodes_platform_check CHECK (platform IN ('android', 'web', 'desktop')),
  CONSTRAINT nodes_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  CONSTRAINT nodes_wallet_lower CHECK (wallet_address = lower(btrim(wallet_address))),
  CONSTRAINT nodes_zerotier_id_format CHECK (zerotier_node_id ~ '^[0-9a-f]{10}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nodes_live_zerotier_node_id
  ON public.nodes (zerotier_node_id)
  WHERE status IN ('pending', 'approved');

CREATE INDEX IF NOT EXISTS idx_nodes_owner_user_id
  ON public.nodes (owner_user_id, created_at DESC)
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nodes_wallet_live
  ON public.nodes (wallet_address)
  WHERE status IN ('pending', 'approved');

ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nodes_select_own_or_reviewer ON public.nodes;
CREATE POLICY nodes_select_own_or_reviewer ON public.nodes
  FOR SELECT TO authenticated
  USING (
    (owner_user_id IS NOT NULL AND owner_user_id = auth.uid())
    OR public.is_network_governance_reviewer()
  );

-- ---------------------------------------------------------------------------
-- node_join_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.node_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  zerotier_node_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  app_version TEXT NOT NULL DEFAULT '',
  challenge_id UUID NOT NULL REFERENCES public.node_join_challenges(id),
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  zerotier_member_id TEXT,
  zerotier_authorized_at TIMESTAMPTZ,
  zerotier_last_error TEXT,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT node_join_requests_platform_check CHECK (platform IN ('android', 'web', 'desktop')),
  CONSTRAINT node_join_requests_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'revoked', 'pending_authorization')
  ),
  CONSTRAINT node_join_requests_wallet_lower CHECK (wallet_address = lower(btrim(wallet_address))),
  CONSTRAINT node_join_requests_zerotier_id_format CHECK (zerotier_node_id ~ '^[0-9a-f]{10}$')
);

CREATE INDEX IF NOT EXISTS idx_node_join_requests_node_id ON public.node_join_requests (node_id);
CREATE INDEX IF NOT EXISTS idx_node_join_requests_status
  ON public.node_join_requests (status, created_at DESC);

ALTER TABLE public.node_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS node_join_requests_select_own_or_reviewer ON public.node_join_requests;
CREATE POLICY node_join_requests_select_own_or_reviewer ON public.node_join_requests
  FOR SELECT TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR public.is_network_governance_reviewer()
  );

-- ---------------------------------------------------------------------------
-- node_heartbeats
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.node_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uptime_secs BIGINT,
  app_version TEXT,
  zerotier_online BOOLEAN,
  peers INTEGER,
  chain_height BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_node_heartbeats_node_reported
  ON public.node_heartbeats (node_id, reported_at DESC);

ALTER TABLE public.node_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS node_heartbeats_select_own_or_reviewer ON public.node_heartbeats;
CREATE POLICY node_heartbeats_select_own_or_reviewer ON public.node_heartbeats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nodes n
      WHERE n.id = node_id
        AND (
          (n.owner_user_id IS NOT NULL AND n.owner_user_id = auth.uid())
          OR public.is_network_governance_reviewer()
        )
    )
  );

GRANT SELECT ON public.nodes TO authenticated;
GRANT SELECT ON public.node_join_requests TO authenticated;
GRANT SELECT ON public.node_heartbeats TO authenticated;

COMMENT ON TABLE public.nodes IS 'Personal network nodes; wallet-signed join; optional Supabase owner_user_id.';
COMMENT ON COLUMN public.nodes.pending_token_hash IS 'SHA-256 of one-time pending token for post-join polling and credential exchange.';
COMMENT ON TABLE public.node_join_requests IS 'Audit trail for wallet-signed join submissions and governance review.';
COMMENT ON TABLE public.node_join_challenges IS 'Single-use EIP-191 join message nonces; server-only access.';
COMMENT ON TABLE public.node_heartbeats IS 'Periodic liveness reports from approved nodes (node credential auth).';
