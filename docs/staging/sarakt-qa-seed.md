# Staging QA — Sarakt / Octa Investment Group

Use a **dedicated staging Supabase project** (not production `agqkiwarwxrcemhspxxv` unless explicitly designated staging).

## 1. Apply migrations

Run migrations in order through:

- `supabase/migrations/20260611150000_sarakt_canonical_product_rules.sql`
- `supabase/migrations/20260611160000_phase1_cap_per_plot_basic_expat.sql`

## 2. Mark environment as staging

```bash
psql "$STAGING_DATABASE_URL" -f supabase/seeds/staging_sarakt_qa.sql
```

Or paste `supabase/seeds/staging_sarakt_qa.sql` into the Supabase SQL editor.

## 3. Create auth test accounts (Dashboard or Admin API)

| Role | Suggested email | Notes |
|------|-----------------|--------|
| Regular owner | `regular_user@test.octa` | Connect wallet `0x…0a01`, link in `user_wallets` |
| Admin / permit reviewer | `admin@test.com` | Set `user_metadata.role` = `admin` or use existing admin heuristic |
| Near cap | `near_cap@test.octa` | Use after simulating 4,999 sold plots |

## 4. Simulate sold plot count (staging only)

Using the **service role** key (never in the browser):

```sql
SELECT public.staging_simulate_plots_sold(4999);
SELECT public.staging_simulate_plots_sold(10000);
SELECT public.count_plots_sold();
SELECT public.get_expat_availability();
```

This function refuses to run unless `platform_runtime_config.environment = 'staging'`.

## 5. Vercel preview env

Set for `/api/*` routes on preview deployments:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Frontend calls APIs with `Authorization: Bearer <supabase_access_token>`.

## 6. QA test plan

See uploaded `permit-expat-test-plan.md` — table names:

- `plot_permit_applications`
- `expat_temp_units` / `expat_temp_unit_assignments`
- `basic_residential_unit_claims` (per `plot_id`)

**plots_sold source of truth:** `public.plots.owner_wallet` on plot ids `1..10000` via `public.count_plots_sold()`.
