-- =============================================================================
-- Octa Investment Group — Phase 1 plot cap, stats sync, security hardening,
-- per-plot basic residential eligibility, expat temp-unit rent model (additive).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Isolated product toggles (easy to flip)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.phase1_sellable_plot_id_max()
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$ SELECT 10000 $$;

CREATE OR REPLACE FUNCTION public.basic_residential_plot_sale_cap()
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$ SELECT 5000 $$;

CREATE OR REPLACE FUNCTION public.basic_residential_requires_approved_residential_permit()
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$ SELECT true $$;

CREATE OR REPLACE FUNCTION public.is_phase1_sellable_plot(p_plot_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT p_plot_id IS NOT NULL
    AND p_plot_id >= 1
    AND p_plot_id <= public.phase1_sellable_plot_id_max();
$$;

-- plots_sold: sold Phase 1 plots only (source of truth = plots.owner_wallet on ids 1..10000)
CREATE OR REPLACE FUNCTION public.count_plots_sold()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.plots p
  WHERE public.is_phase1_sellable_plot(p.id)
    AND p.owner_wallet IS NOT NULL
    AND btrim(p.owner_wallet) <> '';
$$;

-- Mark non–Phase-1 inventory rows (id > 10000) as out of scope — no deletes.
UPDATE public.plots
SET booking_status = COALESCE(NULLIF(btrim(booking_status), ''), 'phase2_inventory'),
    updated_at = NOW()
WHERE id > public.phase1_sellable_plot_id_max()
  AND (owner_wallet IS NULL OR btrim(owner_wallet) = '')
  AND COALESCE(booking_status, '') NOT IN ('purchased', 'phase2_inventory');

COMMENT ON COLUMN public.plots.booking_status IS
  'phase2_inventory marks plot ids above Phase 1 sellable cap (Octa Investment Group; rows retained).';

-- ---------------------------------------------------------------------------
-- Per-plot sale rank (first 5,000 **plots sold**, not persons)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_plot_sale_ranks AS
WITH sold AS (
  SELECT
    p.id AS plot_id,
    lower(p.owner_wallet) AS owner_wallet,
    COALESCE(
      (
        SELECT MIN(pp.created_at)
        FROM public.plot_purchases pp
        WHERE pp.plot_id = p.id
          AND pp.status IN ('completed', 'confirmed')
      ),
      p.updated_at,
      p.created_at
    ) AS sold_at
  FROM public.plots p
  WHERE public.is_phase1_sellable_plot(p.id)
    AND p.owner_wallet IS NOT NULL
    AND btrim(p.owner_wallet) <> ''
)
SELECT
  plot_id,
  owner_wallet,
  sold_at,
  ROW_NUMBER() OVER (ORDER BY sold_at ASC, plot_id ASC)::INTEGER AS sale_rank
FROM sold;

CREATE OR REPLACE FUNCTION public.get_plot_sale_rank(p_plot_id INTEGER)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.sale_rank
  FROM public.v_plot_sale_ranks r
  WHERE r.plot_id = p_plot_id;
$$;

REVOKE ALL ON FUNCTION public.get_plot_sale_rank(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_plot_sale_rank(INTEGER) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.plot_has_approved_residential_permit(
  p_plot_id INTEGER,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN NOT public.basic_residential_requires_approved_residential_permit() THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.plot_permit_applications a
      WHERE a.plot_id = p_plot_id
        AND a.applicant_user_id = p_user_id
        AND a.status = 'approved'::public.permit_application_status
        AND a.assigned_type = 'residential'::public.permit_plot_type
    )
  END;
$$;

-- ---------------------------------------------------------------------------
-- Basic residential claims — per plot
-- ---------------------------------------------------------------------------
ALTER TABLE public.basic_residential_unit_claims
  ADD COLUMN IF NOT EXISTS plot_id INTEGER REFERENCES public.plots(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_basic_residential_claim_plot
  ON public.basic_residential_unit_claims (plot_id)
  WHERE plot_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.enforce_basic_residential_claim_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_rank INTEGER;
  v_cap INTEGER := public.basic_residential_plot_sale_cap();
  v_owner_wallet TEXT;
BEGIN
  IF NEW.plot_id IS NULL THEN
    RAISE EXCEPTION 'plot_id_required'
      USING ERRCODE = '23514',
            DETAIL = 'Basic residential unit claim requires plot_id.';
  END IF;

  SELECT lower(p.owner_wallet)
  INTO v_owner_wallet
  FROM public.plots p
  WHERE p.id = NEW.plot_id;

  IF v_owner_wallet IS NULL OR v_owner_wallet <> lower(btrim(NEW.wallet_address)) THEN
    RAISE EXCEPTION 'not_plot_owner'
      USING ERRCODE = '23514',
            DETAIL = 'Wallet does not own this plot.';
  END IF;

  v_rank := public.get_plot_sale_rank(NEW.plot_id);
  IF v_rank IS NULL OR v_rank > v_cap THEN
    RAISE EXCEPTION 'basic_residential_ineligible'
      USING ERRCODE = '23514',
            DETAIL = format(
              'Basic residential unit applies only to the first %s plots sold (plot sale_rank=%s).',
              v_cap,
              COALESCE(v_rank::text, 'null')
            );
  END IF;

  IF NOT public.plot_has_approved_residential_permit(NEW.plot_id, NEW.user_id) THEN
    RAISE EXCEPTION 'residential_permit_required'
      USING ERRCODE = '23514',
            DETAIL = 'An approved residential permit is required for this plot.';
  END IF;

  RETURN NEW;
END;
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
  v_cap INTEGER := public.basic_residential_plot_sale_cap();
  v_plots JSONB;
BEGIN
  IF p_user_id IS NULL
     OR (p_user_id <> auth.uid() AND NOT public.is_dashboard_admin()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_wallet := public.resolve_auth_user_wallet(p_user_id);
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('cap', v_cap, 'wallet_address', NULL, 'plots', '[]'::jsonb);
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'plot_id', r.plot_id,
        'sale_rank', r.sale_rank,
        'eligible',
          (
            r.sale_rank <= v_cap
            AND public.plot_has_approved_residential_permit(r.plot_id, p_user_id)
            AND NOT EXISTS (
              SELECT 1 FROM public.basic_residential_unit_claims c
              WHERE c.plot_id = r.plot_id
            )
          ),
        'approved_residential_permit', public.plot_has_approved_residential_permit(r.plot_id, p_user_id),
        'claimed', EXISTS (
          SELECT 1 FROM public.basic_residential_unit_claims c
          WHERE c.plot_id = r.plot_id
        )
      )
      ORDER BY r.sale_rank ASC, r.plot_id ASC
    ),
    '[]'::jsonb
  )
  INTO v_plots
  FROM public.v_plot_sale_ranks r
  WHERE r.owner_wallet = v_wallet;

  RETURN jsonb_build_object(
    'cap', v_cap,
    'wallet_address', v_wallet,
    'plots', v_plots
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_basic_residential_eligibility(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_basic_residential_eligibility(UUID) TO authenticated;

DROP FUNCTION IF EXISTS public.claim_basic_residential_unit();

CREATE OR REPLACE FUNCTION public.claim_basic_residential_unit(p_plot_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_wallet TEXT;
  v_id UUID;
  v_row JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_plot_id IS NULL OR NOT public.is_phase1_sellable_plot(p_plot_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_plot_id');
  END IF;

  v_wallet := public.resolve_auth_user_wallet(v_uid);
  IF v_wallet IS NULL THEN
    RAISE EXCEPTION 'basic_residential_ineligible' USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.basic_residential_unit_claims (user_id, wallet_address, plot_id)
  VALUES (v_uid, v_wallet, p_plot_id)
  RETURNING id INTO v_id;

  SELECT public.get_basic_residential_eligibility(v_uid) INTO v_row;

  RETURN jsonb_build_object('success', true, 'claim_id', v_id, 'plot_id', p_plot_id, 'eligibility', v_row);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_claimed');
  WHEN SQLSTATE '23514' THEN
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_basic_residential_unit(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_basic_residential_unit(INTEGER) TO authenticated;

-- ---------------------------------------------------------------------------
-- Expat temp units + rent-bearing assignments (no payment processing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expat_temp_units (
  unit_number INTEGER PRIMARY KEY CHECK (unit_number >= 1 AND unit_number <= 100),
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO public.expat_temp_units (unit_number, label)
SELECT g, 'Octa Investment Group Temp Unit ' || g::text
FROM generate_series(1, 100) AS g
ON CONFLICT (unit_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.expat_temp_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number INTEGER NOT NULL REFERENCES public.expat_temp_units(unit_number) ON DELETE RESTRICT,
  tenant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rent_amount NUMERIC NOT NULL CHECK (rent_amount >= 0),
  rent_currency TEXT NOT NULL DEFAULT 'xBGL',
  rent_period TEXT NOT NULL DEFAULT 'monthly' CHECK (rent_period IN ('monthly', 'weekly')),
  period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_expat_temp_unit_one_open_assignment
  ON public.expat_temp_unit_assignments (unit_number)
  WHERE status IN ('pending', 'active');

CREATE INDEX IF NOT EXISTS idx_expat_assignments_tenant
  ON public.expat_temp_unit_assignments (tenant_user_id, created_at DESC);

ALTER TABLE public.expat_temp_unit_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY expat_assignments_select_own ON public.expat_temp_unit_assignments
  FOR SELECT TO authenticated
  USING (tenant_user_id = auth.uid() OR public.is_dashboard_admin());

CREATE POLICY expat_assignments_insert_tenant ON public.expat_temp_unit_assignments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_expat_assignment_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.count_plots_sold() < public.phase1_sellable_plot_id_max() THEN
    RAISE EXCEPTION 'expat_closed'
      USING ERRCODE = '23514',
            DETAIL = 'Expat temporary units open only after all Phase 1 plots are sold.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_expat_assignment_gate ON public.expat_temp_unit_assignments;
CREATE TRIGGER trg_expat_assignment_gate
  BEFORE INSERT ON public.expat_temp_unit_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_expat_assignment_gate();

CREATE OR REPLACE VIEW public.v_expat_availability AS
SELECT
  public.count_plots_sold() AS plots_sold,
  public.phase1_sellable_plot_id_max() AS plots_total,
  (public.count_plots_sold() >= public.phase1_sellable_plot_id_max()) AS expat_open,
  100 AS temp_units_total,
  (
    SELECT COUNT(*)::INTEGER
    FROM public.expat_temp_unit_assignments a
    WHERE a.status IN ('pending', 'active')
  ) AS temp_units_allocated,
  (
    100 - (
      SELECT COUNT(*)::INTEGER
      FROM public.expat_temp_unit_assignments a
      WHERE a.status IN ('pending', 'active')
    )
  ) AS temp_units_available;

CREATE OR REPLACE FUNCTION public.get_expat_availability()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'plots_sold', v.plots_sold,
    'plots_total', v.plots_total,
    'expat_open', v.expat_open,
    'temp_units_total', v.temp_units_total,
    'temp_units_allocated', v.temp_units_allocated,
    'temp_units_available', v.temp_units_available,
    'rent_currency_default', 'xBGL',
    'rent_period_default', 'monthly',
    'temp_units', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'unit_number', u.unit_number,
            'label', u.label,
            'is_active', u.is_active,
            'is_allocated', EXISTS (
              SELECT 1 FROM public.expat_temp_unit_assignments a
              WHERE a.unit_number = u.unit_number
                AND a.status IN ('pending', 'active')
            )
          )
          ORDER BY u.unit_number
        ),
        '[]'::jsonb
      )
      FROM public.expat_temp_units u
      WHERE u.is_active
    )
  )
  FROM public.v_expat_availability v;
$$;

-- ---------------------------------------------------------------------------
-- campaign_stats / ilo_stats — single active row + derived spots_taken
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.ilo_stats') IS NOT NULL THEN
    WITH keeper AS (
      SELECT id
      FROM public.ilo_stats
      WHERE is_active = true
      ORDER BY updated_at DESC NULLS LAST, campaign_start_date DESC NULLS LAST
      LIMIT 1
    )
    UPDATE public.ilo_stats s
    SET is_active = false
    WHERE s.is_active = true
      AND s.id NOT IN (SELECT id FROM keeper);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_ilo_stats_one_active
      ON public.ilo_stats (is_active)
      WHERE is_active = true;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.refresh_ilo_stats_from_plot_sales()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.ilo_stats') IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.ilo_stats s
  SET
    spots_taken = public.count_plots_sold(),
    total_spots = public.phase1_sellable_plot_id_max(),
    updated_at = NOW()
  WHERE s.is_active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_ilo_stats_from_plots()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_ilo_stats_from_plot_sales();
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_plots_refresh_ilo_stats ON public.plots;
CREATE TRIGGER trg_plots_refresh_ilo_stats
  AFTER INSERT OR UPDATE OF owner_wallet ON public.plots
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_refresh_ilo_stats_from_plots();

SELECT public.refresh_ilo_stats_from_plot_sales();

CREATE OR REPLACE FUNCTION public.get_ilo_stats()
RETURNS TABLE (
  total_spots INTEGER,
  spots_taken INTEGER,
  spots_remaining INTEGER,
  total_raised_usdc NUMERIC,
  total_raised_eur NUMERIC,
  participants_count INTEGER,
  progress_percentage NUMERIC,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_ilo_stats_from_plot_sales();

  RETURN QUERY
  SELECT
    s.total_spots,
    public.count_plots_sold() AS spots_taken,
    GREATEST(s.total_spots - public.count_plots_sold(), 0) AS spots_remaining,
    s.total_raised_usdc,
    s.total_raised_eur,
    s.participants_count,
    CASE WHEN s.total_spots > 0
      THEN ROUND((public.count_plots_sold()::NUMERIC / s.total_spots::NUMERIC) * 100, 2)
      ELSE 0
    END AS progress_percentage,
    s.is_active
  FROM public.ilo_stats s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_ilo_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_ilo_stats() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- purchase_plot — Phase 1 cap + sold-out guard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purchase_plot(
  p_plot_id INTEGER,
  p_buyer_wallet TEXT,
  p_buyer_email TEXT,
  p_price NUMERIC,
  p_currency TEXT DEFAULT 'xBGL'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_w TEXT := lower(p_buyer_wallet);
  v_e TEXT := lower(trim(p_buyer_email));
  v_purchase_id UUID;
  v_existing_owner TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'authentication required');
  END IF;
  IF v_e IS NULL OR v_e = '' OR lower(auth.jwt() ->> 'email') != v_e THEN
    RETURN jsonb_build_object('success', false, 'error', 'email mismatch');
  END IF;

  IF NOT public.is_phase1_sellable_plot(p_plot_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_outside_phase1_cap');
  END IF;

  IF public.count_plots_sold() >= public.phase1_sellable_plot_id_max() THEN
    RETURN jsonb_build_object('success', false, 'error', 'phase1_sold_out');
  END IF;

  SELECT lower(p.owner_wallet)
  INTO v_existing_owner
  FROM public.plots p
  WHERE p.id = p_plot_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot not found');
  END IF;

  IF v_existing_owner IS NOT NULL AND btrim(v_existing_owner) <> '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_already_sold');
  END IF;

  UPDATE public.plots
  SET owner_wallet = v_w, booking_status = 'purchased', updated_at = NOW()
  WHERE id = p_plot_id;

  INSERT INTO public.ownership_registry (wallet_address, email, updated_at)
  VALUES (v_w, v_e, NOW())
  ON CONFLICT (wallet_address) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();

  INSERT INTO public.plot_purchases (plot_id, buyer_wallet, purchase_price, currency, status)
  VALUES (p_plot_id, v_w, p_price, COALESCE(p_currency, 'xBGL'), 'completed')
  RETURNING id INTO v_purchase_id;

  PERFORM public.refresh_ilo_stats_from_plot_sales();

  RETURN jsonb_build_object(
    'success', true,
    'plot_id', p_plot_id,
    'purchase_id', v_purchase_id,
    'txHash', 'purchase_' || p_plot_id::text || '_' || extract(epoch FROM NOW())::text
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Security: hide plot owner_email from anon; revoke dangerous RPC execute from anon
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plots' AND column_name = 'owner_email'
  ) THEN
    EXECUTE 'REVOKE SELECT (owner_email) ON public.plots FROM anon';
    EXECUTE 'REVOKE SELECT (owner_email) ON public.plots FROM authenticated';
  END IF;
END $$;

CREATE OR REPLACE VIEW public.plots_public AS
SELECT
  p.id,
  p.coord_x,
  p.coord_y,
  p.zone_type,
  p.booking_status,
  p.building_stage,
  p.display_label,
  (p.owner_wallet IS NOT NULL AND btrim(p.owner_wallet) <> '') AS is_sold
FROM public.plots p;

GRANT SELECT ON public.plots_public TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.mint_tokens(TEXT, NUMERIC, TEXT, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_treasury_transfer(text, numeric, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_all_auth_users() FROM anon;

-- ---------------------------------------------------------------------------
-- Staging-only helpers (guarded — never enabled on production by migration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_runtime_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_runtime_config ENABLE ROW LEVEL SECURITY;
-- No client policies: service role / SQL editor only.

CREATE OR REPLACE FUNCTION public.is_staging_environment()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_runtime_config c
    WHERE c.key = 'environment'
      AND c.value = 'staging'
  );
$$;

CREATE OR REPLACE FUNCTION public.staging_simulate_plots_sold(p_target_count INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap INTEGER := public.phase1_sellable_plot_id_max();
  v_wallet TEXT := '0xstaging00000000000000000000000000000001';
  v_i INTEGER;
BEGIN
  IF NOT public.is_staging_environment() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501', DETAIL = 'staging_simulate_plots_sold is staging-only';
  END IF;

  IF p_target_count < 0 OR p_target_count > v_cap THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_out_of_range', 'max', v_cap);
  END IF;

  UPDATE public.plots
  SET owner_wallet = NULL, booking_status = 'available', updated_at = NOW()
  WHERE public.is_phase1_sellable_plot(id);

  FOR v_i IN 1..p_target_count LOOP
    UPDATE public.plots
    SET owner_wallet = v_wallet, booking_status = 'purchased', updated_at = NOW()
    WHERE id = v_i;
  END LOOP;

  PERFORM public.refresh_ilo_stats_from_plot_sales();

  RETURN jsonb_build_object(
    'success', true,
    'plots_sold', public.count_plots_sold(),
    'simulated_wallet', v_wallet
  );
END;
$$;

REVOKE ALL ON FUNCTION public.staging_simulate_plots_sold(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staging_simulate_plots_sold(INTEGER) TO service_role;

-- Indexer mirror: reject plot ids outside Phase 1 sellable range
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
  IF auth.uid() IS NOT NULL AND NOT public.is_dashboard_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;

  IF p_plot_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_id required');
  END IF;

  IF NOT public.is_phase1_sellable_plot(p_plot_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'plot_outside_phase1_cap', 'plot_id', p_plot_id);
  END IF;

  IF v_wallet IS NULL OR v_wallet = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'owner_wallet required');
  END IF;
  IF v_hash IS NULL OR v_hash = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'tx_hash required');
  END IF;

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

  PERFORM public.refresh_ilo_stats_from_plot_sales();

  RETURN jsonb_build_object(
    'success',      true,
    'plot_id',      p_plot_id,
    'new_wallet',   v_wallet,
    'tx_hash',      v_hash,
    'block_number', p_block_number
  );
END;
$$;
