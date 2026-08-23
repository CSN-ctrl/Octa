# Tasks

Prioritized list for Cursor and humans. **PLAN** mode should start here.

## Now

- [x] Retarget Fuji ingest + subgraph to 2026-08-16 stack (57793346)
- [ ] Apply indexer checkpoint cutover on octa + redeploy edge functions
- [ ] Create Fuji Safe 2-of-3 and run `sandbox:transfer:safe`

## Next

- [ ] If using a **remote** `VITE_API_URL`, add its origin to **`index.html` CSP** `connect-src`.
- [ ] Tighten **`is_dashboard_admin()`** (remove `%admin%` email heuristic) before production.

## Done (archive occasionally)

- [x] 2025-03-22 — Replaced `AdminDashboard` **`auth.admin`** usage with DB RPCs + MCP migrations; refreshed `types.ts`.
- [x] 2025-03-07 — Wired frontend to MCP-linked Supabase: `src/config/connections.ts`, `client.ts`, OAuth consent, `types.ts` from MCP, `.env.example`, `env.ts` + `chaosstar-client` API default localhost; removed Alchemy hardcoded key fallback.

---

**Usage:** Edit checkboxes as you progress. After a session, move durable learnings to `memory/long_term.md` or mistakes to `memory/failures.md`.
