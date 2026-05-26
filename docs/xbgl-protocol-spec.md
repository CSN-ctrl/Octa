# xBGL — Full Protocol Specification (Phase 1)

Canonical design reference for `XBGLToken` and `ReserveMintController` on **Avalanche C-Chain (1337)**.  
ChaosStar (8888) may hold a reference address only; the ERC-20 implementation deploys on 1337.

## Overview

xBGL (Bulgarian Reserve) is a **reserve-backed ERC-20 monetary asset** deployed on Avalanche C-Chain.

It serves as the **macro reserve layer** of the Sarakt ecosystem, designed to support long-term economic coordination, treasury operations, and infrastructure funding.

It is **not** a stablecoin, **not** redeemable, and **not** pegged to fiat.

## Core Properties

| Field | Value |
|-------|--------|
| Name | Bulgarian Reserve |
| Symbol | xBGL |
| Standard | ERC-20 |
| Network | Avalanche C-Chain (local dev: chain 1337) |
| Decimals | 18 |
| Governance | Multisig (Phase 1), DAO transition (Phase 2) |

## System Role

xBGL functions as:

- Reserve settlement asset
- Treasury backbone
- Infrastructure funding layer
- Ecosystem collateral unit
- Macro economic anchor

It is **NOT**:

- A stablecoin
- A fiat-pegged asset
- A redemption token
- A yield farming token

## Monetary Model

xBGL uses a **fractional reserve expansion system**.

**Core principle:** Supply expands only when verified reserve value increases under controlled rules.

### Genesis supply

**10,000,000,000 xBGL** — fixed at deployment, distributed per ecosystem allocation. No uncontrolled minting.

On-chain: `XBGLToken.GENESIS_SUPPLY = 10_000_000_000 ether`.

### Backing ratio

Target relationship (off-chain valuation in Phase 1):

`Supply ≈ R / k`

- `R` = reserve value (USD, oracle-aggregated off-chain in Phase 1)
- `k` = reserve multiplier (recommended **2–3**)

Expansion rule:

`ΔS = ΔR / k`

On-chain Phase 1: `ReserveMintController.mintFromReserveGrowth` implements `ΔS = ΔR / k` with multisig evidence, cooldown, and per-cycle cap.

### Reserve assets (Phase 1 treasury target)

| Asset | Role |
|-------|------|
| BTC | Store of value anchor |
| USDC | Liquidity + stability buffer |
| ETH | Smart contract ecosystem exposure |
| AVAX | Native chain alignment |
| XMR | Privacy + diversification |
| XRP | Liquidity + cross-market exposure |

Reserve is **not** a redemption pool or peg guarantee.

## Issuance controls (on-chain Phase 1)

| Control | Implementation |
|---------|----------------|
| Role gate | `MINTER_ROLE` → `ReserveMintController` only |
| Cooldown | `cooldownSeconds` between expansions |
| Evidence | `evidenceHash` — replay-protected |
| Cycle cap | `maxExpansionPerCycle` |
| Emergency | `pause()` on token + controller |
| Income bridge | `mintFromIncome` — EUR-verified reports → reserve share → xBGL (Phase 1 ops) |

## Treasury architecture (Phase 1)

- Operational treasury, reserve vault, liquidity vault (off-chain / multisig)
- Multisig threshold signing
- Emergency pause on token and mint controller

## Demand & sinks (ecosystem)

**Demand:** infrastructure funding, land/planetary expansion, treasury collateral, governance locks.

**Sinks:** deployment costs, governance locks, expansion fees, faction reserves.

## Legal positioning

Utility reserve asset and ecosystem settlement token — **non-redeemable**, not a stablecoin or investment contract.

## Evolution

| Phase | Focus |
|-------|--------|
| 1 | Crypto reserve, fixed genesis, controlled expansion, multisig |
| 2 | DAO governance, treasury automation |
| 3 | Expanded instruments, optional RWA |

## Implementation map

| Spec | Contract |
|------|----------|
| ERC-20, 10B genesis, pause | `src/contracts/phase1/XBGLToken.sol` |
| Expansion, k, caps, cooldown | `src/contracts/phase1/ReserveMintController.sol` |
| Deploy 1337 stack | `script/DeployLocalAvax.s.sol`, `npm run sandbox:deploy` |
| Tests | `test/XBGLReservePolicy.t.sol` |

## Final summary

> xBGL is the reserve backbone of the Sarakt economic system — a fractional reserve ERC-20 monetary foundation for a synthetic planetary economy.
