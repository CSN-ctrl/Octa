# Skills evolution (living playbook)

Project skills live under `.cursor/skills/<skill-id>/SKILL.md`. They are **not** frozen: they should improve when reality diverges from the playbook.

### Global Cursor install (all workspaces)

To use **this repo’s** skills and rules in **every** Cursor project, publish them to your user `.cursor` folder:

```bash
npm run cursor:publish-global
```

This merges `.cursor/skills/**` → `~/.cursor/skills/` and `.cursor/rules/**` → `~/.cursor/rules/` (same paths on Windows under `%USERPROFILE%\.cursor`). Run again after you add or update vendored skills. Use `--dry-run` on the script to preview destinations.

**Vendored packs**

- **Corey Haines marketing** — sync from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) into `.cursor/skills/` (unprefixed ids); routing uses `haines_*` domains.
- **Awesome Cursor Skills** — install from [spencerpauly/awesome-cursor-skills](https://github.com/spencerpauly/awesome-cursor-skills) via `node scripts/governance/install-awesome-cursor-skills.cjs` (copies as `acs-*` to avoid name clashes); regenerate routing with `node scripts/governance/generate-acs-skill-routing.cjs` and merge into `skill-routing-map.yaml` if upstream adds skills.
- **Community rules catalog** — refresh `docs/references/awesome-cursor-rules-mdc/` with `node scripts/governance/install-awesome-cursor-rules-reference.cjs`; copy chosen `.mdc` files into `.cursor/rules/` only when needed (see `docs/cursor-community-rules.md`).
- **Figma plugin skills** — from [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) into `.cursor/skills/figma-*`; install the [Figma Cursor plugin](https://cursor.com/marketplace/figma) for MCP. Regenerate routing with `node scripts/governance/generate-figma-plugin-skill-routing.cjs`.
- **Community rules (.mdc catalog)** — refresh `docs/references/awesome-cursor-rules-mdc/` with `node scripts/governance/install-awesome-cursor-rules-reference.cjs`; copy chosen files into `.cursor/rules/` only when needed ([guide](cursor-community-rules.md)).
- **Figma plugin skills** — vendored `figma-*` from [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide); still install the **Figma** plugin in Cursor + connect MCP ([cursor-figma-plugin.md](cursor-figma-plugin.md)).

## After meaningful work (Learn step)

When a task surfaces a gap (wrong guidance, missing constraint, outdated path):

1. Note it in `cursor-brain/memory/failures.md` (one or two lines: symptom + skill id).
2. Propose a concrete SKILL.md edit: add a bullet, fix a link, tighten a gate, or bump `metadata.version` if present.

## Promotion criteria

Update a skill when **any** of these hold:

- The same mistake would recur without the change.
- Governance (`skill-routing-map.yaml`, RLS, ledger rules) changed and the skill still references old behavior.
- A reviewer or user repeatedly overrides the skill’s default advice.

Do **not** bloat skills with one-off trivia; move long references to `references/` inside the skill folder when the upstream skill supports it.

## Versioning

- Prefer YAML frontmatter already present (`metadata.version`, `last_reviewed`).
- Bump version when behavior **changes**; append a short “changelog” line at the top of the body or in git commit message only—avoid duplicate novels across skills.

## Routing alignment

If new triggers or domains appear (new folder, new risk class), update `cursor-brain/governance/skill-routing-map.yaml` so auto-routing stays truthful.

## Cadence

- **Lightweight:** scan `failures.md` for skill tags when you touch that domain again.
- **Deeper:** after a release or large merge, spot-check the top 3 skills you relied on for freshness.

See also: `prompt-execution-governor` SKILL — **Learn** section and `cursor-brain/patterns.md` for durable patterns that might graduate into skills.
