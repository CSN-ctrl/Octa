# Fuji staging — complete phase checklist

**Scope:** Avalanche Fuji (`43113`) only. Mainnet deferred.  
**Invariant:** `requireDigitalID() == false`  
**Branch / PR:** `cursor/fuji-contract-hardening-46ee`

Legend: **Code** = done in repo · **Live** = needs operator keys / Fuji Safe

---

## Phase 0 — Baseline
| Item | Status |
|---|---|
| Canonical addresses = `sandbox/deployments/43113-latest.json` (+ `public/sandbox/deployments/`) | **Code** |
| Stale `public/addresses.json` aligned to Fuji map | **Code** |
| Frontend ABI matches SaraktLandV2 (no fake `TOTAL_PLOTS` / `setRequireDigitalID`) | **Code** |

## Phase 1 — Stabilize live rail
| Item | Status |
|---|---|
| `npm run sandbox:verify:fuji` probes owner, sales, wiring, requireDigitalID | **Code** |
| Current Fuji stack wired + `requireDigitalID=false` | **Live** (verified read-only) |
| Indexer start blocks documented (update after redeploy) | **Code** |

## Phase 2 — Safe ownership
| Item | Status |
|---|---|
| `scripts/sandbox/transfer-treasury-to-safe.mjs` implemented | **Code** |
| Hard-rejects `43114`; Fuji-only; Ownable2Step aware | **Code** |
| Runbook: `docs/ops/treasury-multisig-mainnet.md` (Fuji staging) | **Code** |
| Create Fuji Safe 2-of-3 + run transfer + `acceptOwnership` | **Live** (needs `SAFE_ADDRESS` + deployer key) |

## Phase 3 — Contract hardening
| Item | Status |
|---|---|
| Land/Treasury `Ownable2Step` + `Pausable` | **Code** |
| Foundry `SaraktAccessControl` tests | **Code** |
| Deploy defaults: `SALES_ACTIVE=false`, requireDigitalID false enforced | **Code** |
| `npm run sandbox:deploy:fuji` via `DeployFuji.s.sol` | **Code** |
| Redeploy hardened bytecode to Fuji + refresh manifests/env | **Live** ✓ 2026-08-16 |
| Fuji-only `adminResetPlot` / `adminClearPlotRecord` | **Code** + **Live** (buy→reset→rebuy verified) |
| Fuji-only `adminGrantPlot` / `adminClearPendingBuyer` + free-test CLI | **Code** + **Live** (grant→reset→regrant + `loop 99`) |

## Phase 4 — Verify & smoke
| Item | Status |
|---|---|
| `npm run sandbox:verify:fuji` | **Code** |
| `npm run sandbox:smoke:fuji` | **Code** (existing) |
| Snowtrace verify source | **Live** (after redeploy; optional API key) |
| Indexer curl/SQL health | See `docs/ops/fuji-staging-ops.md` · **Live** secrets |

## Phase 5 — Production-like ops (still Fuji)
| Item | Status |
|---|---|
| Rate / pause / metadata / monitoring runbook | **Code** → `docs/ops/fuji-staging-ops.md` |
| Vercel stays on Fuji envs | **Live** (`npm run vercel:env:fuji` when addresses change) |

---

## Operator sequence (live gate)

```bash
cp sandbox/.env.example sandbox/.env   # fill ALCHEMY_API_KEY, FUJI_PRIVATE_KEY
npm run sandbox:deploy:fuji            # SALES_ACTIVE=false by default
npm run sandbox:verify:fuji            # expect hardened=yes
# Create Safe on Fuji → set SAFE_ADDRESS
DRY_RUN=1 npm run sandbox:transfer:safe
npm run sandbox:transfer:safe          # then Safe acceptOwnership on Land+Treasury
# Safe: setXbglPerAvax, toggleSales(true) when ready
npm run sandbox:smoke:fuji
# Update Vercel + FUJI_START_BLOCK to new deploy block
```

## Deferred
- Avalanche mainnet `43114`
- Enabling `requireDigitalID`
