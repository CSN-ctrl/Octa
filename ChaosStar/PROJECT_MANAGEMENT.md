# ChaosStar project management (current tree)

**2026 context:** The Go VM (`chaosstarvm`), embedded `hypersdk`, and `chaosstar-wallet` are **not in this repository**. The active codebase is the **Octa** web application:

`stuff/Octa-758dd321db5a23889f15871624cfb035465e77ab/`

The bullets below apply to **that** package unless you restore the old VM from git history.

---

## Critical focus areas

1. **Automated checks on every PR**  
   Wire CI to run `npm run test:run`, `npm run typecheck`, and `npm run build` in the Octa directory. Add `npm run lint` once ESLint flat config is in place.

2. **Dependency hygiene**  
   Commit and use `package-lock.json` for reproducible installs (`npm ci` in CI). Resolve peer dependency warnings deliberately rather than papering over with flags unless documented.

3. **Supabase and secrets**  
   Never commit service role keys. Document required `VITE_*` and Supabase variables in the Octa app README or `docs/`, not in chat logs.

4. **Documentation drift**  
   Many `ChaosStar/*.md` files are historical status reports. When behavior changes, update the Octa app’s `README.md` / `docs/` first; add a short note at the top of legacy files if they are still linked externally.

---

## Suggested repository layout (documentation)

- **`ChaosStar/README.md`** — how this folder relates to Octa  
- **`ChaosStar/QUICK_START.md`** — minimal commands for local dev  
- **`stuff/Octa-.../README.md`** — product-facing setup for the app  
- **`stuff/Octa-.../docs/`** — deep technical write-ups when needed  

---

## What to avoid

- Treating old “100% production ready” claims in archived markdown as current fact without verifying the Octa app and CI.  
- Adding new long-lived binaries or submodules under `ChaosStar/` root without an explicit decision (see root hygiene rules in the Octa `.cursor/rules` if you use Cursor there).

---

## Historical note

Earlier revisions of this file listed `chaosstarvm/actions/*` tests, multiple `go.mod` files, and VM-specific CI. That guidance applied to **removed** code; keep it in mind only if you reintroduce a Go VM as a separate module or repository.
