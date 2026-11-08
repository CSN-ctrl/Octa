# Vercel Cron vs Hobby plan (ZeroTier retry scheduler)

`POST /api/nodes/zt-retry` (and **`GET`** with valid cron auth, for legacy Vercel Cron compatibility) is served by the consolidated API router entry **`api/nodes.ts`**.

## Auth contract

| Caller | Method | Headers | Body |
|--------|--------|---------|------|
| **Scheduler** (pg_cron, former Vercel Cron) | `POST` or `GET` | `Authorization: Bearer <CRON_SECRET>` | Optional `{}` for POST |
| **Governance reviewer** | `POST` only | Supabase `Authorization: Bearer <access_token>` | — |

`CRON_SECRET` is the Vercel/production env var. Scheduler and app must use the **same** secret value.

Optional query: `?force=true` or `?force=1` retries all pending rows.

## Vercel Hobby limit

**Hobby** cannot use sub-daily Vercel Cron schedules. The old config was:

```json
"crons": [{ "path": "/api/nodes/zt-retry", "schedule": "*/15 * * * *" }]
```

(added in commit `67ac703`, removed in `99424f1` — deploy failed on Hobby.)

Do **not** add that cron back to `vercel.json` on Hobby.

## Recommended: Supabase pg_cron + pg_net

We use **pg_cron** + **pg_net** with secrets in **Supabase Vault** (no secrets in SQL or git).

### 1. Vault secrets

Create via SQL Editor or Dashboard (values are **not** committed):

```sql
SELECT vault.create_secret(
  'https://YOUR_PRODUCTION_HOST/api/nodes/zt-retry',
  'zt_retry_url',
  'Full URL for ZeroTier retry endpoint'
);

SELECT vault.create_secret(
  'YOUR_CRON_SECRET_MATCHING_VERCEL',
  'cron_secret',
  'Bearer token for /api/nodes/zt-retry (same as Vercel CRON_SECRET)'
);
```

| Vault name | Purpose |
|------------|---------|
| `zt_retry_url` | Full HTTPS URL to `.../api/nodes/zt-retry` |
| `cron_secret` | Raw secret (SQL adds `Bearer ` prefix) |

### 2. Apply schedule SQL (manual)

**File:** `docs/ops/sql/schedule_zt_retry_pg_cron.sql`

This is **ops SQL**, not under `supabase/migrations/` — nothing in CI auto-applies it. Run once in the Supabase SQL Editor on the project that should trigger retries.

- Job name: `zt_retry_vercel` (idempotent unschedule + reschedule)
- Schedule: `*/15 * * * *` (every 15 minutes — same as former Vercel cron)
- HTTP: `net.http_post` with JSON `{}` and `Authorization: Bearer ...`

### 3. Verify

```sql
SELECT jobid, jobname, schedule, command FROM cron.job WHERE jobname = 'zt_retry_vercel';

SELECT jobid, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'zt_retry_vercel' LIMIT 1)
ORDER BY start_time DESC
LIMIT 20;

SELECT id, status_code, timed_out, error_msg, created
FROM net._http_response
ORDER BY created DESC
LIMIT 20;
```

Expect HTTP **200** on the app side when ZT is configured (or **200** with `zerotier_enabled: false` when disabled). **401**/**403** mean secret/URL mismatch.

### 4. Log retention (production)

Job **`trim_cron_job_run_details_daily`** (cron job id **3** on prod) already trims **3 days** of `cron.job_run_details` and **1 day** of `net._http_response` history.

## Fallbacks

- Opportunistic retries when nodes hit authenticated `/api/nodes/*` routes
- Manual `POST /api/nodes/zt-retry` as governance reviewer

When upgrading to **Vercel Pro**, you may re-add the `vercel.json` cron or keep pg_cron only.
