# Community Cursor rules (reference)

This repo’s **authoritative** agent conventions remain in **`.cursor/rules/`** (always-apply governance, brain workflow, skill routing).

For **additional**, stack-specific rules, use the local snapshot under **`docs/references/awesome-cursor-rules-mdc/`**:

| Path | Purpose |
|------|---------|
| `rules-mdc/*.mdc` | Copy individual files into `.cursor/rules/` when you adopt a stack (e.g. `typescript.mdc`, `tailwind.mdc`). Tune `globs:` and descriptions for your layout. |
| `rules.json` | Machine-readable catalog from upstream |
| `cursor-rules-docs.md` | Authoring reference |

**Do not** drop hundreds of unrelated `.mdc` files into `.cursor/rules/` at once — it increases noise and token cost. Prefer a small set that matches `src/` reality.

Refresh the snapshot: **`scripts/governance/install-awesome-cursor-rules-reference.cjs`**.
