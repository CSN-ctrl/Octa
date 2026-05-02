# Patterns — reusable templates

Copy and adapt; stay consistent with this repo (TypeScript, React 18, Vite, Supabase).

## React page / feature

- Functional components + hooks.
- Imports: use `@/` alias (`@/components`, `@/lib`, etc.).
- UI primitives: `@/components/ui/*` (shadcn-style).
- Heavy routes: `lazy()` + `Suspense` as in `App.tsx`.

## Supabase read helper

```ts
import { supabase } from "@/integrations/supabase/client";

export async function fetchById(table: string, id: string) {
  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
```

Prefer existing helpers in `@/lib/supabase-service.ts` when they already cover the table.

## Environment (client)

Use **`@/config/connections`** for Supabase (MCP-linked project ref + env overrides):

```ts
import { getSupabaseUrl, getSupabaseAnonKey } from "@/config/connections";
```

For the Go API / PDF backend, use **`getApiUrl()`** from `@/env` (backed by `VITE_API_URL`).

Never commit **service_role** or private keys. Document new `VITE_*` vars in `.env.example`.

## Node / CLI script skeleton

```ts
#!/usr/bin/env npx tsx
async function main() {
  // ...
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## Solidity (this repo)

- Match pragma and style of existing contracts under `src/contracts/` or project `contracts/`.
- Use OpenZeppelin if the rest of the contract already does.

## Print / document views

- Certificate-style UIs: see `src/components/documents/LandTitleCertificateView.tsx` and `id="land-title-certificate-document"` + print CSS in `src/index.css`.

---

**Extend** this file when a new pattern proves reusable across tasks.

## Skills

- Operating loop and skill gates: `.cursor/skills/prompt-execution-governor/SKILL.md` and `cursor-brain/governance/skill-routing-map.yaml`.
- When a pattern stabilizes, consider promoting it from here into the relevant `SKILL.md` (see `docs/skills-evolution.md`).
