# Figma (Cursor plugin + skills)

## Install the plugin

1. Open **Cursor Settings → Plugins / Marketplace**.
2. Install **[Figma](https://cursor.com/marketplace/figma)** (official plugin by Figma, verified by Cursor).
3. Complete authentication so the **Figma MCP server** is available to the agent ([plugin source / guide](https://github.com/figma/mcp-server-guide)).

Without the plugin and MCP connection, skills under `.cursor/skills/figma-*` cannot call Figma tools.

## Skills in this repo

Nine workflows from **`figma/mcp-server-guide`** are vendored under `.cursor/skills/`:

- `figma-use`, `figma-use-figjam`
- `figma-generate-design`, `figma-implement-design`, `figma-generate-library`
- `figma-code-connect`, `figma-create-design-system-rules`
- `figma-create-new-file`, `figma-generate-diagram`

Routing domains use the prefix **`figma_plugin_*`** in `cursor-brain/governance/skill-routing-map.yaml`.

## Refresh from upstream

```bash
git clone --depth 1 https://github.com/figma/mcp-server-guide.git .tmp-figma
# copy skills/figma-* into .cursor/skills/
node scripts/governance/generate-figma-plugin-skill-routing.cjs
# merge _generated-figma-routing.yaml into skill-routing-map if needed
```

## Cross-links

Some skills reference sibling paths like `../figma-use/SKILL.md`; keep all `figma-*` folders together under `.cursor/skills/`.
