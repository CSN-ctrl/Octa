# Fuji indexer production cutover (octa)

Project: `agqkiwarwxrcemhspxxv`  
Contracts deployed at Fuji block **55878103** (Snowtrace `0x35362d7`).

## 1. Migrations (applied via Supabase MCP)

| Migration | Purpose |
|-----------|---------|
| `20260610140000_octa_indexer_bootstrap.sql` | Minimal `plots`, `ownership_registry`, treasury checkpoints, `onchain_deposits` |
| `20260610120000_blockchain_indexer_and_funnel.sql` | N-confirmation columns, `chain_plot_holdings`, funnel views, land-transfer cron |
| `20260610130000_onchain_deposit_credit_job.sql` | `credit_onchain_deposit`, `user_id` backfill |
| `20260609140000_fuji_deposit_ingest_schedule.sql` | Deposit ingest pg_cron |
| `20260611120000_seed_phase1_plots.sql` | Seed plots 1–200 for land indexer |
| `20260611120100_pause_legacy_usdc_cron.sql` | Pause legacy USDC cron until mainnet rail |

## 2. Edge functions

- `ingest-fuji-deposits` — AvaxSwappedForXbgl + confirm + credit pipeline
- `ingest-fuji-land-transfers` — TransferSingle + LandMinted → `sync_chain_plot_ownership`

Both use `verify_jwt: false` (cron invokes via pg_net).

## 3. Required edge function secrets

Set in Supabase Dashboard → Edge Functions → Secrets (or `supabase secrets set`):

| Secret | Value |
|--------|-------|
| `ALCHEMY_API_KEY` | Alchemy Fuji RPC key |
| `FUJI_START_BLOCK` | `55878103` |
| `FUJI_LAND_START_BLOCK` | `55878103` |
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
