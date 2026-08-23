# Fuji indexer production cutover (octa)

Project: `agqkiwarwxrcemhspxxv`

## Deploy / start-block note

| Source | Block | Notes |
|--------|------:|-------|
| **Current stack (2026-08-16 free-test kit)** | **57793346** | Land `0x60FE42…` create tx `0xfc0d6fa1…`; Treasury same block. Edge-function defaults + subgraph `startBlock`. |
| Retired stack (do not index) | 55878103 / ~55796439 | Land `0xc34a5fcb…`, Treasury `0xee0ba6de…` — ingest functions return 409 if these addresses are still set as secrets |

After any **redeploy**, do **not** reuse either number blindly: take the new contracts’ creation / first-tx block from the explorer, then set:

- `FUJI_START_BLOCK`
- `FUJI_LAND_START_BLOCK`

Reset or advance `treasury_ingest_checkpoints` if you intentionally re-scan.

## 1. Migrations (applied via Supabase MCP)

| Migration | Purpose |
|-----------|---------|
| `20260610140000_octa_indexer_bootstrap.sql` | Minimal `plots`, `ownership_registry`, treasury checkpoints, `onchain_deposits` |
| `20260610120000_blockchain_indexer_and_funnel.sql` | N-confirmation columns, `chain_plot_holdings`, funnel views, land-transfer cron |
| `20260610130000_onchain_deposit_credit_job.sql` | `credit_onchain_deposit`, `user_id` backfill |
| `20260609140000_fuji_deposit_ingest_schedule.sql` | Deposit ingest pg_cron |
| `20260611120000_seed_phase1_plots.sql` | Seed plots 1–200 for land indexer |
| `20260823160000_fuji_indexer_stack_cutover.sql` | Reset `fuji` / `fuji-land` checkpoints to 57793345 for the new stack |

## 2. Edge functions

- `ingest-fuji-deposits` — AvaxSwappedForXbgl + confirm + credit pipeline
- `ingest-fuji-land-transfers` — TransferSingle + LandMinted → `sync_chain_plot_ownership`

Both use `verify_jwt: false` (cron invokes via pg_net).

## 3. Required edge function secrets

Set in Supabase Dashboard → Edge Functions → Secrets (or `supabase secrets set`):

| Secret | Value |
|--------|-------|
| `ALCHEMY_API_KEY` | Alchemy Fuji RPC key |
| `FUJI_TREASURY_ADDRESS` | `0x5b468dfa4cdbd11d307fc0221e80ac3e2a50b284` (optional; code default matches) |
| `FUJI_LAND_ADDRESS` | `0x60fe424140720400815f068938e473e0a572b282` (optional; code default matches) |
| `FUJI_START_BLOCK` | `57793346` |
| `FUJI_LAND_START_BLOCK` | `57793346` |
| `FUJI_DEPOSIT_CONFIRMATIONS` | `3` |
| `INGEST_CRON_SECRET` | (optional) random string; add matching header to cron if used |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## 4. Vercel production

```bash
# With VERCEL_TOKEN set:
VERCEL_TOKEN=... npm run vercel:env:fuji
npx vercel deploy --prod --scope chaos-projects-54e36297
```

Ensures `VITE_ENABLE_TEST_ROUTES=false`, `VITE_MAINNET_USDC_RAIL=false`, `VITE_PHASE1_DASHBOARD_ONLY=true`, and Fuji contract addresses on project `octa-x4en`. The script auto-runs `vercel deploy --prod` when `VERCEL_TOKEN` is set.

## Verification

```sql
SELECT * FROM treasury_ingest_checkpoints;
SELECT status, COUNT(*) FROM onchain_deposits GROUP BY 1;
SELECT COUNT(*) FROM chain_plot_holdings;
```

Manual trigger:

```bash
curl -X POST https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-fuji-deposits
curl -X POST https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-fuji-land-transfers
```

Staging ops (rate, pause, smoke): [fuji-staging-ops.md](./fuji-staging-ops.md). Master gates: [fuji-staging-checklist.md](./fuji-staging-checklist.md).
