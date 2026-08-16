# Short-term memory

**Current task / session only.**

## Active focus

- Fuji-only production prep: Phase 2 Safe transfer script + Phase 3 pause/Ownable2Step hardening.
- Keep `requireDigitalID = false`. No mainnet (43114) work.

## Scratch

- Branch: `cursor/fuji-contract-hardening-46ee`
- Implement transfer-treasury-to-safe.mjs (stub today)
- Harden SaraktLandV2 + SaraktTreasury (pause, Ownable2Step)
- Foundry tests; redeploy guidance for Fuji if bytecode changes

## Blockers

- None yet (Safe address may be env-provided; script must work without live Safe for unit path)

---

_Reset this file at the beginning of each new task._
