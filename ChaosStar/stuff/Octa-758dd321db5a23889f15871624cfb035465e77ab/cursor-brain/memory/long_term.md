# Long-term memory

**Durable rules and context.** Cursor should skim during **PLAN** and **BUILD**.

## Stack

- **Frontend:** Vite, React, TypeScript; routes in `src/App.tsx`.
- **Data:** Supabase (Postgres, Auth, Storage). Primary service layer: `src/lib/supabase-service.ts`.
- **Wiring:** Supabase project ref **`zfzsiykutsgkurmetprw`** — URLs/anon defaults live in **`src/config/connections.ts`**; keep in sync with Cursor MCP **`user-supabase`** (or Dashboard). Types: **`src/integrations/supabase/types.ts`** (regen via MCP `generate_typescript_types` or Supabase CLI).

## Domain notes

- Land / plots: `plots` table, `owner_wallet`; certificates: `LandTitleCertificateView`, `certificate-data.ts`.
- Admin: `AdminDashboard.tsx` — treasury balance from `user_balances` for configured treasury wallet; nav sync via `window.treasuryBalance` + `treasuryBalanceUpdate` event.
- ILO stats: requires DB objects from `supabase_ilo_stats_schema.sql` if using `useILOStats`.

## Decisions log

_Add dated one-liners as you go:_

- 2025-03-07 — Centralized connections in `src/config/connections.ts`, synced types from MCP, API default `localhost:5001` — one place to match linked Supabase + avoid split defaults.
- 2026-04-15 — CI now computes risk tier from changed paths and conditionally enforces coverage plus governance hooks (regression guard, chaos/economy simulation, lineage telemetry) using `scripts/governance/*`.
- 2026-04-15 — Governance control-plane artifacts live in `cursor-brain/governance/` (`policy-gates.yaml`, `skill-routing-map.yaml`, `run-score.schema.json`, `governance-pack.json`); use `decision-log-template.md` for L2/L3 decisions.

---

Keep entries short; move outdated bullets to git history instead of deleting silently.
