# Phase 1 Smart Contracts (Avalanche C-Chain)

This document defines the broader Phase 1 contract set. The canonical economic specification for standalone xBGL testing is `docs/xbgl-bulgarian-reserve-phase1-spec.md`.

## xBGL-first testing boundary

The current xBGL decision path is contract-only:

- Deploy and test `XBGLToken`.
- Deploy and test `ReserveMintController`.
- Do not wire xBGL into the UI, app routes, Supabase, deposits, land sales, or the broader hub until standalone tests and governance review pass.
- Use `script/DeployXBGLSandbox.s.sol` for xBGL-only testing.

## Current known addresses

- Treasury wallet: `0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33`
- Admin wallet: `0xeaee21E4419924430fc201FE0c9aa554b7488f41`
- Operations wallet: `0x646d85efD142d1d97BddB2D026ed6cff2e9A1102`
- Deployment wallet: `0xF0Fd115d44937f33a13f39f838F99557c22F6124`

## Immutable deployment checklist (must verify before deploy)

- Expected network: Avalanche C-Chain mainnet
- Expected chain id: `43114`
- Expected treasury destination wallet: `0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33`
- Expected admin wallet: `0xeaee21E4419924430fc201FE0c9aa554b7488f41`
- Expected operations wallet: `0x646d85efD142d1d97BddB2D026ed6cff2e9A1102`
- Expected deployment wallet: `0xF0Fd115d44937f33a13f39f838F99557c22F6124`
- Expected USDC token address: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`
- Expected xBGL genesis supply: `10,000,000,000 xBGL` (see `docs/xbgl-protocol-spec.md`)
- Expected initial reserve: none; reserve starts after land-sale income
- Expected xBGL genesis recipient: `0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33`
- Expected reserve share: `3_000` basis points (30% of income)
- Expected issuance reference: `1 EUR = 1.955833 xBGL` (not a peg)
- Expected reserve expansion cooldown: `<SET_COOLDOWN_BEFORE_DEPLOY>` (recommended `7 days`)
- Expected `usdcToXbglRateE18` at launch: `<SET_THIS_BEFORE_DEPLOY>`
- Expected Phase 1 participant cap: `10000`
- Expected minimum deposit (USDC 6 decimals): `<SET_THIS_BEFORE_DEPLOY>`
- Expected max deposit per tx (USDC 6 decimals): `<SET_THIS_BEFORE_DEPLOY>`
- Expected max deposit per wallet (USDC 6 decimals): `<SET_THIS_BEFORE_DEPLOY>`

## Preflight verification (operator runbook)

Before broadcasting deployment transactions, verify all of the following:

1. Wallet and network
   - Deployer account is `0xF0Fd115d44937f33a13f39f838F99557c22F6124` and funded.
   - RPC is pointed to Avalanche C-Chain mainnet (`chainId=43114`).
2. Address constants
   - Treasury wallet equals `0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33`.
   - Admin wallet equals `0xeaee21E4419924430fc201FE0c9aa554b7488f41`.
   - Operations wallet equals `0x646d85efD142d1d97BddB2D026ed6cff2e9A1102`.
   - USDC token address is confirmed from trusted Avalanche docs/explorer.
3. Constructor parameter sheet
   - All constructor values are prepared in a single reviewed config file.
   - Human review confirms no placeholder values remain.
4. Role wiring plan
   - Standalone xBGL testing grants `MINTER_ROLE` only to `ReserveMintController`.
   - Any future `MINTER_ROLE` grant to `Phase1Hub1155` requires a separate integration review.
   - `RESERVE_REPORTER_ROLE` is held by the multisig or governance executor only.
5. Launch safety
   - `phase1Open` remains `false` until post-deploy checks pass.
   - `landSaleOpen` remains `false` until post-deploy checks pass.
   - `ReserveMintController` policy values are reviewed against the signed parameter sheet.

## xBGL-only post-deploy verification

- `XBGLToken.hasRole(MINTER_ROLE, reserveMintController)` returns `true`.
- `XBGLToken.totalSupply()` equals `8,000,000 ether`.
- `XBGLToken.balanceOf(genesisRecipient)` equals `8,000,000 ether`.
- `ReserveMintController.reserveShareBps()` equals `3_000`.
- `ReserveMintController.EUR_TO_XBGL_E18()` equals `1_955_833_000_000_000_000`.
- `ReserveMintController.cooldownSeconds()` equals the approved cooldown.

## Contracts

- `src/contracts/phase1/XBGLToken.sol`
  - ERC20 reserve token (`Bulgarian Reserve`, `xBGL`)
  - Mints 10,000,000,000 xBGL genesis supply at deployment
  - Role-gated mint (`MINTER_ROLE`)
  - Pause controls
  - No redemption, peg, or stablecoin mechanics

- `src/contracts/phase1/ReserveMintController.sol`
  - Multisig-operated reserve expansion controller
  - Allocates 30% of verified income to reserve
  - Calculates expansion mint with `reserveAllocationEUR * 1.955833`
  - Enforces cooldown and unique evidence hash
  - Does not enforce a max issuance cap
  - Requires unique non-zero reserve report evidence hash for auditability
  - Depends on off-chain oracle aggregation and governance approval in Phase 1

- `src/contracts/phase1/Phase1Hub1155.sol`
  - Unified ERC1155 Phase 1 hub
  - Handles USDC deposits, participant caps, treasury routing
  - Mints xBGL via `MINTER_ROLE` on `XBGLToken`
  - Handles land sales (`plotId` ERC1155 minting) with freeze/open controls
  - Includes raffle flow for 1 BTC campaign:
    - participant must own at least 1 plot
    - social requirements are operations-attested on-chain
    - one raffle entry per participant
    - raffle manager selects winner by verifiable off-chain randomness proof reference (`drawRef`)
  - Role model:
    - `DEFAULT_ADMIN_ROLE` (admin)
    - `OPERATIONS_ROLE` (social attestation)
    - `PAUSER_ROLE` (pause/unpause)
    - `RAFFLE_MANAGER_ROLE` (raffle open/close + winner selection)

## Deployment order

For xBGL-only testing, use `script/DeployXBGLSandbox.s.sol`. It deploys only `XBGLToken` and `ReserveMintController`.

`script/DeployFuji.s.sol` is the broader existing hub testnet script and hard-fails unless `block.chainid == 43113`. Do not use it for xBGL-only evaluation.

1. Deploy `XBGLToken` with:
   - admin / multisig
   - genesis recipient
2. Deploy `ReserveMintController` with:
   - admin / multisig
   - deployed `XBGLToken`
   - reserve share basis points (`3_000`)
   - cooldown seconds
Future hub/app integration, not part of xBGL-only testing:

1. Deploy `Phase1Hub1155` with:
   - admin
   - `XBGLToken` address
   - Avalanche USDC token
   - treasury destination wallet (`0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33`)
   - initial `usdcToXbglRateE18`
   - participant/limit parameters
   - plot price in xBGL
   - max plot id
   - base URI
2. Grant `MINTER_ROLE` on `XBGLToken` to `Phase1Hub1155` only after a separate integration review.
3. Transfer ownership/admin control to admin wallet (`0xeaee21E4419924430fc201FE0c9aa554b7488f41`) after deployment if deployer differs.
4. Open flows:
   - set `phase1Open=true` on `Phase1Hub1155` for deposits
   - set `landSaleOpen=true` on `Phase1Hub1155` for land sales
5. Raffle flow:
   - set social completion flags via `setSocialTasksCompleted(...)`
   - open raffle via `setRaffleOpen(true)`
   - participants call `enterRaffle()` after owning at least one plot
   - finalize winner via `selectRaffleWinnerByIndex(winnerIndex, drawRef)`

xBGL reserve expansion flow:

1. Wait until land-sale income exists.
2. Prepare off-chain income/reserve report.
3. Confirm 30% of income is allocated to the reserve.
4. Obtain multisig approval.
5. Submit `mintFromIncome(recipient, incomeEurE18, evidenceHash)`.
6. Archive report artifacts matching the emitted `evidenceHash`.

## Launch invariants

- No deposit-path xBGL mint without successful USDC transfer path.
- No reserve expansion while the reserve is empty.
- No reserve expansion mint without multisig-approved `ReserveMintController` call.
- Reserve expansion must obey 30% reserve allocation, cooldown, and unique evidence rules.
- Expansion uses `1 EUR = 1.955833 xBGL` as issuance math only, not a peg.
- Every reserve expansion must have a unique non-zero evidence hash.
- Participant count never exceeds configured cap.
- Land sale freeze must not pause deposit/mint flow.
- Raffle entry requires at least one owned plot and social attestation.
- xBGL remains non-redeemable and non-pegged; USDC liquidity pairs are market references, not redemption promises.

## Local verification

```bash
forge fmt --check
forge build
forge test -vvv
```
