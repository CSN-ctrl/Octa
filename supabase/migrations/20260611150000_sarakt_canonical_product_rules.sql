-- =============================================================================
-- Octa Investment Group — Sarakt / Octa canonical product rules (server-side)
-- Reversible: drop objects in reverse order; see ROLLBACK section at bottom.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums (locked for frontend parity)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.permit_application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.permit_plot_type AS ENUM (
    'residential',
    'commercial',
    'mixed_use',
    'agricultural',
    'industrial',
    'public'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Optional display label; coordinates (coord_x/coord_y) and zone_type remain canonical location.
ALTER TABLE public.plots
  ADD COLUMN IF NOT EXISTS display_label TEXT;

COMMENT ON COLUMN public.plots.display_label IS
  'Optional human-readable plot label for Octa Investment Group Sarakt/Octa UI; coordinates remain authoritative.';

-- ---------------------------------------------------------------------------
-- Plot permit applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plot_permit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id INTEGER NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  applicant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_type public.permit_plot_type,
  assigned_type public.permit_plot_type,
  status public.permit_application_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  location_confirmed BOOLEAN NOT NULL DEFAULT false,
  location_confirmed_at TIMESTAMPTZ,
  confirmed_plot_id INTEGER REFERENCES public.plots(id) ON DELETE SET NULL,
  confirmed_coord_x NUMERIC,
  confirmed_coord_y NUMERIC,
  location_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plot_permit_approved_invariants CHECK (
    status <> 'approved'::public.permit_application_status
    OR (
      location_confirmed = true
      AND assigned_type IS NOT NULL
    )
  ),
  CONSTRAINT plot_permit_rejected_reason CHECK (
    status <> 'rejected'::public.permit_application_status
    OR rejection_reason IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_plot_permit_one_open_per_plot
  ON public.plot_permit_applications (plot_id)
  WHERE status IN ('pending'::public.permit_application_status, 'approved'::public.permit_application_status);

CREATE INDEX IF NOT EXISTS idx_plot_permit_applicant
  ON public.plot_permit_applications (applicant_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_plot_permit_plot
  ON public.plot_permit_applications (plot_id);

CREATE OR REPLACE FUNCTION public.touch_plot_permit_applications_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plot_permit_applications_updated_at ON public.plot_permit_applications;
CREATE TRIGGER trg_plot_permit_applications_updated_at
  BEFORE UPDATE ON public.plot_permit_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_plot_permit_applications_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_plot_permit_approval_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved'::public.permit_application_status THEN
    IF NOT COALESCE(NEW.location_confirmed, false) THEN
      RAISE EXCEPTION 'location_not_confirmed'
        USING ERRCODE = '23514',
              DETAIL = 'Plot location must be confirmed before approval.';
    END IF;
    IF NEW.assigned_type IS NULL THEN
      RAISE EXCEPTION 'assigned_type_required'
        USING ERRCODE = '23514',
              DETAIL = 'Approval requires assigned_type.';
    END IF;
  END IF;
  IF NEW.status = 'rejected'::public.permit_application_status
     AND (NEW.rejection_reason IS NULL OR btrim(NEW.rejection_reason) = '') THEN
    RAISE EXCEPTION 'rejection_reason_required'
      USING ERRCODE = '23514',
            DETAIL = 'Rejection requires rejection_reason.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plot_permit_approval_rules ON public.plot_permit_applications;
CREATE TRIGGER trg_enforce_plot_permit_approval_rules
  BEFORE INSERT OR UPDATE OF status, location_confirmed, assigned_type, rejection_reason
  ON public.plot_permit_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_plot_permit_approval_rules();

-- ---------------------------------------------------------------------------
-- Reviewers (dashboard admins + explicit reviewer metadata role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_permit_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_dashboard_admin()
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'reviewer'
    OR (auth.jwt() -> 'user_metadata' ->> 'permit_reviewer') = 'true';
$$;

REVOKE ALL ON FUNCTION public.is_permit_reviewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_permit_reviewer() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- JSON helper for API responses (includes plot location details)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.plot_permit_application_to_json(p_application_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', a.id,
    'plot_id', a.plot_id,
    'applicant_user_id', a.applicant_user_id,
    'status', a.status,
    'requested_type', a.requested_type,
    'assigned_type', a.assigned_type,
    'rejection_reason', a.rejection_reason,
    'location_confirmed', a.location_confirmed,
    'location_confirmed_at', a.location_confirmed_at,
    'confirmed_plot_id', a.confirmed_plot_id,
    'confirmed_coord_x', a.confirmed_coord_x,
    'confirmed_coord_y', a.confirmed_coord_y,
    'location_notes', COALESCE(a.location_notes, '{}'::jsonb),
    'reviewer_id', a.reviewer_id,
    'reviewed_at', a.reviewed_at,
    'created_at', a.created_at,
    'updated_at', a.updated_at,
    'plot', jsonb_build_object(
      'id', p.id,
      'display_label', COALESCE(NULLIF(btrim(p.display_label), ''), 'Plot ' || p.id::text),
      'coord_x', p.coord_x,
      'coord_y', p.coord_y,
      'zone_type', p.zone_type
    )
  )
  FROM public.plot_permit_applications a
  INNER JOIN public.plots p ON p.id = a.plot_id
  WHERE a.id = p_application_id;
$$;

REVOKE ALL ON FUNCTION public.plot_permit_application_to_json(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.plot_permit_application_to_json(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- plots_sold source of truth: plots with a non-empty owner_wallet (includes
-- purchase_plot RPC and chain indexer sync_chain_plot_ownership mirrors).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.count_plots_sold()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.plots p
  WHERE p.owner_wallet IS NOT NULL
    AND btrim(p.owner_wallet) <> '';
$$;

REVOKE ALL ON FUNCTION public.count_plots_sold() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_plots_sold() TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.expat_temp_unit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.expat_temp_unit_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY expat_temp_units_select_own ON public.expat_temp_unit_allocations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_dashboard_admin());

CREATE OR REPLACE VIEW public.v_expat_availability AS
SELECT
  public.count_plots_sold() AS plots_sold,
  10000 AS plots_total,
  (public.count_plots_sold() >= 10000) AS expat_open,
  100 AS temp_units_total,
  (SELECT COUNT(*)::INTEGER FROM public.expat_temp_unit_allocations) AS temp_units_allocated;

COMMENT ON VIEW public.v_expat_availability IS
  'Octa Investment Group: expat path opens when plots_sold >= 10000; temp unit cap 100.';

GRANT SELECT ON public.v_expat_availability TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Basic residential unit — first 5,000 owners by first plot acquisition time
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_plot_owner_first_acquisition AS
WITH events AS (
  SELECT lower(pp.buyer_wallet) AS owner_wallet, pp.created_at AS acquired_at
  FROM public.plot_purchases pp
  WHERE pp.status IN ('completed', 'confirmed')
    AND pp.buyer_wallet IS NOT NULL
    AND btrim(pp.buyer_wallet) <> ''
  UNION ALL
  SELECT lower(p.owner_wallet), p.updated_at
  FROM public.plots p
  WHERE p.owner_wallet IS NOT NULL
    AND btrim(p.owner_wallet) <> ''
)
SELECT owner_wallet, MIN(acquired_at) AS first_acquired_at
FROM events
GROUP BY owner_wallet;

CREATE OR REPLACE FUNCTION public.resolve_auth_user_wallet(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet TEXT;
  v_email TEXT := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT lower(uw.wallet_address)
  INTO v_wallet
  FROM public.user_wallets uw
  WHERE uw.user_id = p_user_id
  ORDER BY uw.last_used_at DESC NULLS LAST, uw.connected_at DESC NULLS LAST
  LIMIT 1;

  IF v_wallet IS NOT NULL AND btrim(v_wallet) <> '' THEN
    RETURN v_wallet;
  END IF;

  IF v_email <> '' THEN
    SELECT lower(o.wallet_address)
    INTO v_wallet
    FROM public.ownership_registry o
    WHERE lower(o.email) = v_email
    ORDER BY o.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN NULLIF(btrim(lower(COALESCE(v_wallet, ''))), '');
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_auth_user_wallet(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_auth_user_wallet(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_plot_owner_rank(p_wallet TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      owner_wallet,
      ROW_NUMBER() OVER (ORDER BY first_acquired_at ASC, owner_wallet ASC) AS owner_rank
    FROM public.v_plot_owner_first_acquisition
  )
  SELECT r.owner_rank::INTEGER
  FROM ranked r
  WHERE r.owner_wallet = lower(btrim(p_wallet));
$$;

CREATE OR REPLACE FUNCTION public.get_basic_residential_eligibility(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet TEXT;
  v_rank INTEGER;
  v_cap CONSTANT INTEGER := 5000;
BEGIN
  IF p_user_id IS NULL
     OR (p_user_id <> auth.uid() AND NOT public.is_dashboard_admin()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_wallet := public.resolve_auth_user_wallet(p_user_id);
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'owner_rank', NULL,
      'cap', v_cap,
      'wallet_address', NULL
    );
  END IF;

  v_rank := public.get_plot_owner_rank(v_wallet);

  RETURN jsonb_build_object(
    'eligible', (v_rank IS NOT NULL AND v_rank <= v_cap),
    'owner_rank', v_rank,
    'cap', v_cap,
    'wallet_address', v_wallet
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_basic_residential_eligibility(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_basic_residential_eligibility(UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS public.basic_residential_unit_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

ALTER TABLE public.basic_residential_unit_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY basic_residential_claims_select_own ON public.basic_residential_unit_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_dashboard_admin());

CREATE OR REPLACE FUNCTION public.enforce_basic_residential_claim_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_rank INTEGER;
  v_cap CONSTANT INTEGER := 5000;
BEGIN
  IF public.get_plot_owner_rank(NEW.wallet_address) IS NULL
     OR public.get_plot_owner_rank(NEW.wallet_address) > v_cap THEN
    RAISE EXCEPTION 'basic_residential_ineligible'
      USING ERRCODE = '23514',
            DETAIL = 'Basic residential unit is limited to the first 5000 plot owners.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_basic_residential_claim_eligibility ON public.basic_residential_unit_claims;
CREATE TRIGGER trg_basic_residential_claim_eligibility
  BEFORE INSERT ON public.basic_residential_unit_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_basic_residential_claim_eligibility();

CREATE OR REPLACE FUNCTION public.claim_basic_residential_unit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_wallet TEXT;
  v_elig JSONB;
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_elig := public.get_basic_residential_eligibility(v_uid);
  IF NOT COALESCE((v_elig ->> 'eligible')::BOOLEAN, false) THEN
    RAISE EXCEPTION 'basic_residential_ineligible'
      USING ERRCODE = '23514',
            DETAIL = 'Not among the first 5000 plot owners.';
  END IF;

  v_wallet := v_elig ->> 'wallet_address';

  INSERT INTO public.basic_residential_unit_claims (user_id, wallet_address)
  VALUES (v_uid, v_wallet)
  ON CONFLICT (user_id) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'claim_id', v_id, 'eligibility', v_elig);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_basic_residential_unit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_basic_residential_unit() TO authenticated;

-- ---------------------------------------------------------------------------
-- Social actions — BTC award eligibility only (not plot/permit/expat/rank)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('post', 'follow', 'share', 'comment')),
  platform TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_actions_wallet ON public.social_actions (lower(wallet_address), created_at DESC);

ALTER TABLE public.social_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY social_actions_insert_own ON public.social_actions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY social_actions_select_own ON public.social_actions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_dashboard_admin());

CREATE OR REPLACE VIEW public.btc_award_eligibility AS
SELECT
  lower(sa.wallet_address) AS wallet_address,
  COUNT(*) FILTER (WHERE sa.action_type IN ('post', 'follow', 'share', 'comment')) AS qualifying_actions,
  MAX(sa.created_at) AS last_action_at,
  (COUNT(*) >= 1) AS btc_award_candidate
FROM public.social_actions sa
GROUP BY lower(sa.wallet_address);

COMMENT ON VIEW public.btc_award_eligibility IS
  'Octa Investment Group: social actions count toward BTC award eligibility only.';

GRANT SELECT ON public.btc_award_eligibility TO authenticated;

-- ---------------------------------------------------------------------------
-- Permit RPCs (used by Vercel /api routes)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_plot_permit_application(
  p_plot_id INTEGER,
  p_requested_type public.permit_plot_type DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing public.plot_permit_applications%ROWTYPE;
  v_new_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.plots WHERE id = p_plot_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_not_found');
  END IF;

  SELECT *
  INTO v_existing
  FROM public.plot_permit_applications a
  WHERE a.plot_id = p_plot_id
    AND a.status IN ('pending'::public.permit_application_status, 'approved'::public.permit_application_status)
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.applicant_user_id = v_uid THEN
      RETURN jsonb_build_object(
        'success', true,
        'existing', true,
        'application', public.plot_permit_application_to_json(v_existing.id)
      );
    END IF;
    RAISE EXCEPTION 'permit_exists'
      USING ERRCODE = '23505',
            DETAIL = 'Another user already has an open permit for this plot.';
  END IF;

  INSERT INTO public.plot_permit_applications (
    plot_id, applicant_user_id, requested_type, status
  ) VALUES (
    p_plot_id, v_uid, p_requested_type, 'pending'::public.permit_application_status
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'existing', false,
    'application', public.plot_permit_application_to_json(v_new_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_plot_permit_applications()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_apps JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(public.plot_permit_application_to_json(a.id) ORDER BY a.created_at DESC), '[]'::jsonb)
  INTO v_apps
  FROM public.plot_permit_applications a
  WHERE a.applicant_user_id = v_uid;

  RETURN jsonb_build_object('success', true, 'applications', v_apps);
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_plot_permit_location(
  p_application_id UUID,
  p_plot_id INTEGER DEFAULT NULL,
  p_coord_x NUMERIC DEFAULT NULL,
  p_coord_y NUMERIC DEFAULT NULL,
  p_location_notes JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.plot_permit_applications%ROWTYPE;
  v_plot public.plots%ROWTYPE;
  v_plot_id INTEGER;
  v_x NUMERIC;
  v_y NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM public.plot_permit_applications
  WHERE id = p_application_id AND applicant_user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_row.status <> 'pending'::public.permit_application_status THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_pending');
  END IF;

  SELECT * INTO v_plot FROM public.plots WHERE id = v_row.plot_id;
  v_plot_id := COALESCE(p_plot_id, v_row.plot_id);
  v_x := COALESCE(p_coord_x, v_plot.coord_x);
  v_y := COALESCE(p_coord_y, v_plot.coord_y);

  UPDATE public.plot_permit_applications
  SET
    location_confirmed = true,
    location_confirmed_at = NOW(),
    confirmed_plot_id = v_plot_id,
    confirmed_coord_x = v_x,
    confirmed_coord_y = v_y,
    location_notes = COALESCE(p_location_notes, location_notes, '{}'::jsonb)
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application', public.plot_permit_application_to_json(p_application_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_plot_permit_application(
  p_application_id UUID,
  p_action TEXT,
  p_assigned_type public.permit_plot_type DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.plot_permit_applications%ROWTYPE;
BEGIN
  IF NOT public.is_permit_reviewer() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row FROM public.plot_permit_applications WHERE id = p_application_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF lower(trim(p_action)) = 'approve' THEN
    IF NOT COALESCE(v_row.location_confirmed, false) THEN
      RAISE EXCEPTION 'location_not_confirmed'
        USING ERRCODE = '23514',
              DETAIL = 'Cannot approve until location is confirmed.';
    END IF;
    IF p_assigned_type IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'assigned_type_required');
    END IF;

    UPDATE public.plot_permit_applications
    SET
      status = 'approved'::public.permit_application_status,
      assigned_type = p_assigned_type,
      rejection_reason = NULL,
      reviewer_id = auth.uid(),
      reviewed_at = NOW()
    WHERE id = p_application_id;

  ELSIF lower(trim(p_action)) = 'reject' THEN
    IF p_rejection_reason IS NULL OR btrim(p_rejection_reason) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'rejection_reason_required');
    END IF;

    UPDATE public.plot_permit_applications
    SET
      status = 'rejected'::public.permit_application_status,
      assigned_type = NULL,
      rejection_reason = p_rejection_reason,
      reviewer_id = auth.uid(),
      reviewed_at = NOW()
    WHERE id = p_application_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'invalid_action');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'application', public.plot_permit_application_to_json(p_application_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_expat_availability()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'plots_sold', plots_sold,
    'plots_total', plots_total,
    'expat_open', expat_open,
    'temp_units_total', temp_units_total,
    'temp_units_allocated', temp_units_allocated
  )
  FROM public.v_expat_availability;
$$;

REVOKE ALL ON FUNCTION public.create_plot_permit_application(INTEGER, public.permit_plot_type) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_my_plot_permit_applications() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_plot_permit_location(UUID, INTEGER, NUMERIC, NUMERIC, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_plot_permit_application(UUID, TEXT, public.permit_plot_type, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_expat_availability() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_plot_permit_application(INTEGER, public.permit_plot_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_plot_permit_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_plot_permit_location(UUID, INTEGER, NUMERIC, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_plot_permit_application(UUID, TEXT, public.permit_plot_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expat_availability() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- RLS — plot_permit_applications
-- ---------------------------------------------------------------------------
ALTER TABLE public.plot_permit_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY plot_permit_select ON public.plot_permit_applications
  FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid() OR public.is_permit_reviewer());

CREATE POLICY plot_permit_insert_own ON public.plot_permit_applications
  FOR INSERT TO authenticated
  WITH CHECK (applicant_user_id = auth.uid());

CREATE POLICY plot_permit_update_own_pending ON public.plot_permit_applications
  FOR UPDATE TO authenticated
  USING (applicant_user_id = auth.uid() AND status = 'pending'::public.permit_application_status)
  WITH CHECK (applicant_user_id = auth.uid() AND status = 'pending'::public.permit_application_status);

CREATE POLICY plot_permit_update_reviewer ON public.plot_permit_applications
  FOR UPDATE TO authenticated
  USING (public.is_permit_reviewer())
  WITH CHECK (public.is_permit_reviewer());

-- ---------------------------------------------------------------------------
-- ROLLBACK (manual):
-- DROP VIEW btc_award_eligibility; DROP TABLE social_actions;
-- DROP FUNCTION claim_basic_residential_unit; DROP TABLE basic_residential_unit_claims;
-- DROP VIEW v_plot_owner_first_acquisition; DROP FUNCTION get_plot_owner_rank;
-- DROP FUNCTION get_basic_residential_eligibility; DROP FUNCTION resolve_auth_user_wallet;
-- DROP TABLE expat_temp_unit_allocations; DROP VIEW v_expat_availability;
-- DROP FUNCTION count_plots_sold; DROP FUNCTION get_expat_availability;
-- DROP TABLE plot_permit_applications; DROP TYPE permit_plot_type; DROP TYPE permit_application_status;
-- ALTER TABLE plots DROP COLUMN IF EXISTS display_label;
-- ---------------------------------------------------------------------------
