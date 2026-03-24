# Anti-patterns — avoid

## General

- **Hardcoding** production URLs, keys, treasury addresses, or admin allowlists in many files — centralize (env + **`src/config/connections.ts`** for Supabase; **`src/env.ts`** for `VITE_API_URL`).
- **Hardcoding third-party API keys** (e.g. Alchemy) in source — use `VITE_*` only; degrade when unset.
- **Duplicating** Supabase access that belongs in `supabase-service.ts` — add a function there instead.
- **Empty `catch`** blocks with no log, toast, or rethrow.
- **Overusing `any`** — prefer interfaces and Supabase generated types.

## Security

- Relying only on client checks for admin or treasury actions — enforce RLS and/or server-side rules.
- Shipping service role keys or private keys in frontend bundles.

## Reliability

- Assuming Supabase tables/RPCs exist without documenting required migrations — add SQL files and README notes; degrade gracefully in UI when optional.
- **Stale imports** — e.g. calling `getTreasury` from `@/lib/api` if it is not exported (verify exports before use).

## Product / UX

- Blocking the whole page on non-critical requests — use loading states and partial UI.
- Mixing **mock/demo** data (e.g. DAO treasury demos) with **live** Supabase paths without labeling which is which.

---

**Add bullets** when reviews or incidents surface repeatable mistakes.
