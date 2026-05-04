# Quick Start (Octa web app)

All active application code lives under:

`stuff/Octa-758dd321db5a23889f15871624cfb035465e77ab/`

## Local development

```bash
cd stuff/Octa-758dd321db5a23889f15871624cfb035465e77ab
npm install
npm run dev
```

## Checks (from the same directory)

```bash
npm run test:run
npm run typecheck
npm run build
```

Note: `npm run lint` may require an ESLint flat config; see the Octa app’s tooling state in that folder.

## Documentation

- [README.md](README.md) — how this `ChaosStar/` tree relates to Octa
- Many other `.md` files here are **legacy status reports**; prefer the Octa app’s `README.md` and `docs/` for current product behavior.
