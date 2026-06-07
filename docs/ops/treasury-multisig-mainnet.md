# Treasury Multisig — Mainnet Transfer Runbook

**Status:** Pre-mainnet checklist  
**Owner:** Core team ops  
**Last updated:** 2026-06-07

---

## Context

`SaraktTreasury` is deployed on Avalanche Fuji (chain 43113) with a single EOA owner during development.
Before any mainnet deployment the owner role **must** be transferred to a Gnosis Safe multisig to prevent single-key loss or compromise.

This document covers the required steps, Safe configuration expectations, and verification checklist.

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| Gnosis Safe deployed on target network | Minimum 2-of-3 signers recommended for testnet; 3-of-5 for mainnet |
| All signers have hardware wallets (Ledger/Trezor) | Software-only signers are not accepted for treasury operations |
| Safe address recorded in `sandbox/deployments/<chainId>-latest.json` as `safeAddress` | Add the key before running transfer |
| Current owner EOA holds enough AVAX for gas | At least 0.1 AVAX on the deployer key |
| `DEPLOYER_PRIVATE_KEY` env var available in terminal session | Do NOT commit to repo |

---

## 2. Safe Configuration (Mainnet)

Recommended Safe setup for mainnet:

```
Signers: 5
Threshold: 3-of-5
Network: Avalanche C-Chain (chainId 43114)
```

For Fuji staging:

```
Signers: 3
Threshold: 2-of-3
Network: Avalanche Fuji (chainId 43113)
```

Create the Safe at [app.safe.global](https://app.safe.global/) → Connect wallet → New Safe → Avalanche network.

---

## 3. Transfer Steps

### 3a. Confirm current owner

```bash
cast call $VITE_TREASURY_ADDRESS "owner()(address)" \
  --rpc-url $VITE_AVALANCHE_RPC
```

Output should match the deployer EOA address in `sandbox/deployments/43113-latest.json`.

### 3b. Confirm Safe address

```bash
# The Safe address you will transfer ownership to
SAFE_ADDRESS=<gnosis-safe-address>
```

Verify the Safe exists and has correct signers:

```bash
cast call $SAFE_ADDRESS "getOwners()(address[])" \
  --rpc-url $VITE_AVALANCHE_RPC
```

### 3c. Run the transfer script

```bash
DEPLOYER_PRIVATE_KEY=<key> \
SAFE_ADDRESS=<safe-address> \
CHAIN_ID=43113 \
  node scripts/sandbox/transfer-treasury-to-safe.mjs
```

The script will:
1. Read `sandbox/deployments/<chainId>-latest.json` for the treasury address.
2. Call `SaraktTreasury.transferOwnership(safeAddress)`.
3. Wait for receipt and print the transaction hash.
4. Call `owner()` to confirm the new owner matches `safeAddress`.

### 3d. Accept ownership (OwnableV2 two-step, if applicable)

If the contract uses OpenZeppelin's `Ownable2Step`, the Safe must accept ownership:

1. Open the Safe UI at [app.safe.global](https://app.safe.global/).
2. Navigate to **New Transaction → Contract Interaction**.
3. Enter `SaraktTreasury` address and ABI.
4. Call `acceptOwnership()` — requires threshold signers to approve.
5. Execute when threshold is reached.

Confirm final owner:

```bash
cast call $VITE_TREASURY_ADDRESS "owner()(address)" \
  --rpc-url $VITE_AVALANCHE_RPC
```

Must equal `SAFE_ADDRESS`.

---

## 4. Post-Transfer Verification Checklist

- [ ] `owner()` returns the Safe address (not the deployer EOA)
- [ ] Deployer EOA can no longer call `onlyOwner` functions (test with `withdrawAvax(0, deployer)` — expect revert)
- [ ] Safe signers can propose and execute a no-op transaction (`renounceOwnership` with a rejection) to confirm quorum flow
- [ ] Treasury address and new `safeAddress` recorded in deployment JSON
- [ ] `.env.production` `VITE_TREASURY_ADDRESS` unchanged (contract address is the same; only the internal owner changes)
- [ ] Update `cursor-brain/memory/long_term.md` with the Safe address and transfer tx hash

---

## 5. Emergency Procedures

**If the Safe becomes inaccessible (signers lost keys):**
- This is irrecoverable for the treasury owner role if all signers are lost.
- Maintain off-site encrypted backups of each signer's seed phrase.
- Consider a time-locked guardian contract as a backstop (future improvement).

**If the transfer is accidentally sent to the wrong address:**
- If the wrong address is an EOA you control, use that key to call `transferOwnership(safeAddress)` immediately.
- If the wrong address is a contract without `acceptOwnership`, the treasury is bricked — audit before sending.

---

## 6. References

- [Gnosis Safe Documentation](https://docs.safe.global/)
- [OpenZeppelin Ownable2Step](https://docs.openzeppelin.com/contracts/5.x/api/access#Ownable2Step)
- `scripts/sandbox/transfer-treasury-to-safe.mjs` — automated transfer script
- `sandbox/deployments/43113-latest.json` — current Fuji deployment manifest
