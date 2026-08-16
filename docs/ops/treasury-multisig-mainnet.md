# Treasury Multisig — Fuji Staging Runbook

**Status:** Fuji (43113) staging checklist — mainnet deferred  
**Owner:** Core team ops  
**Last updated:** 2026-08-16

---

## Context

Phase 1 contracts on Avalanche Fuji use a single EOA owner during early development.
Before treating Fuji as production-like staging, transfer ownership to a Gnosis Safe.

Hardened contracts (`SaraktTreasury`, `SaraktLandV2`) use **Ownable2Step** + **Pausable**:
- Script calls `transferOwnership(safe)` → sets `pendingOwner`
- Safe must call `acceptOwnership()` to take control
- `LocalDigitalID` remains plain `Ownable` (1-step) while `requireDigitalID` stays **false**

**Redeploy note:** Pause / Ownable2Step require a **new Fuji deploy** of Land + Treasury before transferring the hardened bytecode. Do not transfer old addresses expecting pause selectors.

Mainnet (43114) is **out of scope**. The transfer script **hard-rejects** `CHAIN_ID=43114`.

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Gnosis Safe on **Avalanche Fuji** | 2-of-3 recommended for staging |
| Signers have wallets with Fuji AVAX | Hardware preferred |
| Current owner EOA has gas | ≥ 0.05 AVAX |
| Env vars in shell only | Never commit keys |
| Deployment manifest | `sandbox/deployments/43113-latest.json` |

---

## 2. Safe Configuration (Fuji)

```
Signers: 3
Threshold: 2-of-3
Network: Avalanche Fuji (chainId 43113)
```

Create at [app.safe.global](https://app.safe.global/) → New Safe → Avalanche / Fuji.

---

## 3. Transfer Steps

### 3a. Confirm current owners

```bash
RPC=https://api.avax-test.network/ext/bc/C/rpc
cast call $VITE_TREASURY_ADDRESS "owner()(address)" --rpc-url $RPC
cast call $VITE_CONTRACT_ADDRESS "owner()(address)" --rpc-url $RPC
cast call $VITE_DIGITAL_ID_ADDRESS "owner()(address)" --rpc-url $RPC
```

### 3b. Dry-run (no broadcast)

```bash
DRY_RUN=1 \
DEPLOYER_PRIVATE_KEY=<key> \
SAFE_ADDRESS=<fuji-safe> \
CHAIN_ID=43113 \
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
  node scripts/sandbox/transfer-treasury-to-safe.mjs
```

### 3c. Execute transferOwnership

```bash
DEPLOYER_PRIVATE_KEY=<key> \
SAFE_ADDRESS=<fuji-safe> \
CHAIN_ID=43113 \
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
  node scripts/sandbox/transfer-treasury-to-safe.mjs
```

The script:
1. Rejects mainnet (`43114`) and non-Fuji chain IDs
2. Loads Treasury (+ Land / DigitalID if in manifest)
3. Calls `transferOwnership(SAFE)` from the current owner EOA
4. For Ownable2Step: verifies `pendingOwner == SAFE` (owner unchanged until accept)
5. For LocalDigitalID (1-step): verifies `owner == SAFE`
6. Writes `safeAddress` into the deployment manifest

### 3d. Safe accepts Ownable2Step

For **SaraktTreasury** and **SaraktLandV2**:

1. Safe UI → New Transaction → Contract interaction
2. Address = contract; ABI method = `acceptOwnership()`
3. Threshold sign + execute
4. Verify:

```bash
cast call <treasury> "owner()(address)" --rpc-url $RPC
cast call <land> "owner()(address)" --rpc-url $RPC
# both must equal SAFE_ADDRESS
```

---

## 4. Post-Transfer Checklist

- [ ] Treasury `owner()` == Safe
- [ ] Land `owner()` == Safe
- [ ] DigitalID `owner()` == Safe (1-step)
- [ ] Deployer EOA cannot `pause()` / `withdrawAVAX` (expect revert)
- [ ] Safe can `pause()` / `unpause()` Land and Treasury
- [ ] `requireDigitalID()` still `false`
- [ ] Manifest `safeAddress` recorded
- [ ] Smoke: deposit AVAX→xBGL + buy plot (while unpaused)

---

## 5. Pause policy (hardened contracts)

**Ops rule:** For a full kill-switch, pause **both** Land and Treasury. Pausing only Treasury does **not** stop ERC-20 plot buys (Land pays routing wallets via `transfer`, not `depositERC20`).

| Surface | While paused |
|---|---|
| Land `buyPlotWithAVAX` / `buyPlotWithUSDC` | Blocked |
| Treasury `depositAvaxForXbgl` / `depositERC20` / `receive` | Blocked |
| Treasury `withdrawAVAX` / `withdrawERC20` | **Allowed** (emergency drain) |
| Land owner admin (`toggleSales`, prices, etc.) | Allowed |

---

## 6. Emergency

**Safe inaccessible:** irrecoverable for owner role if all signers lost — keep encrypted seed backups.

**Wrong Safe on 2-step:** cancel by having current owner call `transferOwnership` again to the correct Safe (pending overwritten) before anyone accepts; if already accepted to wrong party, recover only if that party can transfer back.

---

## 7. Deferred (mainnet)

- Avalanche C-Chain `43114` deploy / Safe 3-of-5
- Mainnet indexer + Vercel env cutover
- Enabling `requireDigitalID`

---

## 8. References

- `scripts/sandbox/transfer-treasury-to-safe.mjs`
- `sandbox/deployments/43113-latest.json`
- `src/contracts/phase1/SaraktTreasury.sol` / `SaraktLandV2.sol`
- [Safe docs](https://docs.safe.global/)
- [OpenZeppelin Ownable2Step](https://docs.openzeppelin.com/contracts/5.x/api/access#Ownable2Step)
