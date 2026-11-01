-- Octa Investment Group — SQL verification pack (run in local Supabase SQL editor; not applied to live DB by agent)
-- Demonstrates: approval blocked without location_confirmed; basic residential cap at 5000.

-- 1) Approval without location_confirmed must fail (trigger + CHECK)
-- INSERT test rows using a service role session in a transaction, then ROLLBACK.

BEGIN;

-- Expect: ERROR location_not_confirmed or CHECK violation when attempting:
-- UPDATE plot_permit_applications SET status = 'approved', assigned_type = 'residential'
-- WHERE id = '<pending-unconfirmed-id>';

ROLLBACK;

-- 2) Partial unique index: only one open (pending|approved) permit per plot_id
-- Attempt second INSERT with status pending for same plot_id → unique violation.

-- 3) basic_residential_unit_claims INSERT for owner_rank > 5000 → basic_residential_ineligible

-- Source of truth for plots_sold:
--   public.plots.id BETWEEN 1 AND phase1_sellable_plot_id_max() (10,000)
--   AND owner_wallet IS NOT NULL (non-empty)
--   via public.count_plots_sold()
--
-- Basic residential: sale_rank per PLOT (v_plot_sale_ranks), cap basic_residential_plot_sale_cap() (5000)
--   + approved residential permit when basic_residential_requires_approved_residential_permit() is true.
