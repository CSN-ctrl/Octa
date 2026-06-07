-- Phase 1: tighten is_dashboard_admin + product analytics events.

CREATE OR REPLACE FUNCTION public.is_dashboard_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'treasury_role') = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_dashboard_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dashboard_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.product_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
