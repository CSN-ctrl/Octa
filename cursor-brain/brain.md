# Cursor brain — how to think & work

This folder is the **control center** for AI-assisted work on this repo. Read this file first when starting substantive tasks.

## Modes

Use these modes explicitly in chat (e.g. “PLAN: …”, “BUILD: …”). Each mode has a focus:

| Mode | Purpose |
|------|--------|
| **PLAN** | Read `tasks.md`, skim `memory/long_term.md` and `memory/failures.md`, break work into steps, note risks. Agree the plan before heavy implementation. |
| **BUILD** | Implement in the repo’s **root `src/`** for production features. Use `cursor-brain/src/` only for scratch/spikes. Follow `patterns.md`; avoid `anti_patterns.md` and items in `memory/failures.md`. |
| **ANALYZE** | Review diffs, run tests/lint, check security and edge cases. If something was wrong or fragile, append to `memory/failures.md`. |
| **IMPROVE** (EVOLVE) | Promote lessons: update `memory/long_term.md`, refine `patterns.md`, extend `anti_patterns.md` when needed. Clear or reset `memory/short_term.md` when the task is done. |

## Workflow loop

1. **PLAN** → 2. **BUILD** → 3. **ANALYZE** → 4. **IMPROVE** → repeat.

You can run one mode per message or chain them in one session (or use Cursor macros).

## File map

| File | Role |
|------|------|
| `tasks.md` | Prioritized work queue for Cursor and humans. |
| `patterns.md` | Templates and conventions to reuse. |
| `anti_patterns.md` | Mistakes and practices to avoid. |
| `memory/short_term.md` | Current task scratchpad — **reset each new task**. |
| `memory/long_term.md` | Durable rules, architecture notes, decisions. |
| `memory/failures.md` | Past mistakes — **do not repeat**. |
| `cursor-brain/src/` | Optional scratch/experiments only. |

## Project context

**Octavia / Chaos Star** — Vite + React + TypeScript, Supabase (auth, DB, storage), wallet flows, land/plots, certificates, admin dashboards. Prefer extending `src/lib/supabase-service.ts` and existing patterns over duplicating logic.

## Connections (single source of truth)

- **Supabase URL + anon key:** `src/config/connections.ts` (`getSupabaseUrl`, `getSupabaseAnonKey`). Project ref **`zfzsiykutsgkurmetprw`** matches the Cursor **MCP `user-supabase`** linked project.
- **Client singleton:** `src/integrations/supabase/client.ts` — imports from `@/config/connections` only (no scattered fallbacks).
- **Go API base:** `VITE_API_URL` via `src/env.ts` (`getApiUrl()`); default **`http://localhost:5001`** (same as `getChaosStarClient` fallback).
- **Regenerate DB types:** MCP `generate_typescript_types` or CLI → `src/integrations/supabase/types.ts` (header comment documents this).
