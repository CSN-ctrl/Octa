# Reference catalogs (local snapshots)

## Awesome Cursor Rules MDC ([sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc))

Sparse checkout in `awesome-cursor-rules-mdc/` includes:

- **`rules-mdc/`** — standalone `.mdc` snippets you can copy into `.cursor/rules/` (pick technologies relevant to this repo). Also see **`rules.json`** for metadata.
- **`cursor-rules-docs.md`**, **`cursor-rules-reference.md`** — format and authoring guidance.
- **`README.md`** — upstream index.

The upstream **`rules-v0-deprecated/`** tree was omitted on Windows because many paths exceed the legacy `MAX_PATH` limit when cloned fully. To refresh:

```bash
# From repo root ( POSIX shell ); or run scripts/governance/install-awesome-cursor-rules-reference.cjs
rm -rf docs/references/awesome-cursor-rules-mdc
git clone --depth 1 --filter=blob:none --sparse https://github.com/sanjeed5/awesome-cursor-rules-mdc.git docs/references/awesome-cursor-rules-mdc
cd docs/references/awesome-cursor-rules-mdc
git sparse-checkout set rules-mdc cursor-rules-docs.md cursor-rules-reference.md rules.json README.md LICENSE
```

Other curated lists (browse online; do not vendor wholesale): [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules), [tugkanboz/awesome-cursorrules](https://github.com/tugkanboz/awesome-cursorrules).

See **`docs/cursor-community-rules.md`** for how we use this alongside project `.cursor/rules/`.
