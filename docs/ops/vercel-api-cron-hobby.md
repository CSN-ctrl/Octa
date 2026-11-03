# Vercel Cron vs Hobby plan

`POST /api/nodes/zt-retry` is served by the catch-all API router (`api/[...path].ts`). Auth is unchanged: `Authorization: Bearer $CRON_SECRET` or governance reviewer.

**Hobby** projects cannot use sub-daily Vercel Cron schedules (e.g. `*/15 * * * *` fails deploy). Do **not** add high-frequency crons to `vercel.json` on Hobby. Use opportunistic retries on node routes, Supabase/pg_net, or an external scheduler hitting `/api/nodes/zt-retry` with `CRON_SECRET`.

When upgrading to Pro, the schedule documented in `docs/personal-node-onboarding-api.md` can be added back to `vercel.json`.
