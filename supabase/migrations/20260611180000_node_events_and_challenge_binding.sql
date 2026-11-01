-- Personal Node: challenge binding columns + append-only audit events

ALTER TABLE public.node_join_challenges
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS join_domain TEXT,
  ADD COLUMN IF NOT EXISTS chain_id TEXT,
  ADD COLUMN IF NOT EXISTS join_environment TEXT,
  ADD COLUMN IF NOT EXISTS replace_node_id UUID REFERENCES public.nodes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.node_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT node_events_type_check CHECK (
    event_type IN (
      'joined',
      'approved',
      'rejected',
      'zt_authorized',
      'zt_auth_failed',
      'credential_issued',
      'credential_rotated',
      'revoked',
      'heartbeat_rejected'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_node_events_node_created
  ON public.node_events (node_id, created_at DESC);

ALTER TABLE public.node_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS node_events_select_own_or_reviewer ON public.node_events;
CREATE POLICY node_events_select_own_or_reviewer ON public.node_events
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

GRANT SELECT ON public.node_events TO authenticated;

COMMENT ON TABLE public.node_events IS
  'Append-only Personal Node audit trail (API/service_role writes). Legacy sarakt-node claim_node silent revoke must not be replicated; migrate with explicit replaced_by_new_device / governance revoke only.';
