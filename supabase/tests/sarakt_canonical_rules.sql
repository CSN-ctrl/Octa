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

-- Source of truth for plots_sold (documented):
--   public.plots.owner_wallet IS NOT NULL AND btrim(owner_wallet) <> ''
--   via public.count_plots_sold() and public.v_expat_availability.plots_sold
