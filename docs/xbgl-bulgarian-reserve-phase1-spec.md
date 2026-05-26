# xBGL Bulgarian Reserve — Phase 1 Protocol Specification

Last verified: 2026-05-13

## Summary

xBGL is the Bulgarian Reserve token for the Sarakt ecosystem. It is a reserve-backed ERC-20 monetary asset on Avalanche C-Chain used as a macro reserve layer, settlement asset, treasury backbone, and infrastructure funding unit.

xBGL is not a stablecoin, not fiat-pegged, not redeemable, and not a legal claim on treasury assets.

## Core Token Properties

| Property | Value |
| --- | --- |
| Name | Bulgarian Reserve |
| Symbol | xBGL |
| Standard | ERC-20 |
| Network | Avalanche C-Chain |
| Decimals | 18 |
| Genesis supply | 10,000,000,000 xBGL |
| Initial reserve | None |
| Phase 1 governance | Multisig-controlled roles |
| Phase 2 governance | DAO transition candidate |

## Phase 1 Contract Set

| Contract | Purpose |
| --- | --- |
| `XBGLToken` | ERC-20 token, **10B** genesis mint, pause control, role-gated minting |
| `ReserveMintController` | Multisig-operated reserve expansion controller with 30% reserve-share math, EUR/xBGL issuance reference, cooldown, and evidence hash |

The initial xBGL sandbox intentionally does not wire xBGL into the app, UI, land-sale hub, Supabase, or any production flow. `Phase1Hub1155` remains a separate existing contract surface and should only be connected after standalone xBGL tests and governance review pass.

## Standalone Test Scope

Use this scope before deciding how xBGL enters the broader app:

- Deploy `XBGLToken`.
- Deploy `ReserveMintController`.
- Grant `XBGLToken.MINTER_ROLE` to `ReserveMintController`.
- Test genesis supply, role-gated minting, reserve expansion math, cooldown, evidence replay protection, and pause behavior.

Do not wire xBGL into UI, app routes, Supabase, land sales, deposits, or treasury automation during this sandbox phase.

## Monetary Model

xBGL uses income-backed reserve expansion logic.

After the first land sale is ready, ecosystem income is split by policy:

```text
reserveAllocation = income * 30%
```

Supply expands from the verified reserve allocation:

```text
deltaSupply = reserveAllocationEUR * 1.955833
```

`1 EUR = 1.955833 xBGL` is an issuance reference derived from the EUR/BGN conversion relationship. It is not a market peg, redemption promise, or fiat guarantee.

Expanded:

```text
deltaSupply = incomeEUR * 30% * 1.955833
```

Phase 1 default controller parameters:

| Parameter | Default |
| --- | --- |
| `reserveShareBps` | `3_000` (30% of income) |
| `EUR_TO_XBGL_E18` | `1.955833e18` |
| `cooldownSeconds` | `7 days` |

These values are governance parameters and must be reviewed before mainnet deployment.

## Genesis Supply

Full protocol: **`docs/xbgl-protocol-spec.md`**.

At deployment, `XBGLToken` mints exactly:

```text
10,000,000,000 * 10^18 xBGL
```

The full genesis supply is minted to the treasury wallet: `0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33`.

Genesis is not a reserve expansion event. It is the initial monetary base.

## Initial Reserve State

Phase 1 starts with no initial reserve balance.

The reserve begins only after the first land-sale system is ready and starts producing treasury income. Until real treasury income exists and a multisig-approved reserve report is produced, no reserve expansion mint should be executed.

## Reserve Architecture

Phase 1 uses three treasury buckets:

| Bucket | Purpose |
| --- | --- |
| Operational Treasury | Working capital, expenses, deployments, and operating liquidity |
| Reserve Vault | Strategic reserve assets and long-horizon backing |
| Liquidity Vault | Protocol-owned liquidity and market operations |

Reserve assets may include BTC, USDC, ETH, AVAX, XMR, and XRP.

The reserve acts as a confidence buffer, issuance reference, liquidity stabilizer, and systemic risk absorber. It is not a redemption pool or peg guarantee.

## Reserve Valuation

Reserve value is represented as:

```text
R = total EUR value of reserve assets
```

Phase 1 valuation is computed off-chain using land-sale income records and, later, aggregated oracle and market data for reserve assets. The signed income/reserve report should include:

- Gross income in EUR terms.
- 30% reserve allocation amount.
- Asset balances by vault once assets exist.
- EUR prices and source feeds when conversion is required.
- Reserve increase since the previous accepted report.
- Oracle/fallback sources used.
- Governance approval record.
- Evidence hash submitted on-chain.

## Reserve Expansion Flow

1. Treasury assets increase through land-sale income first, then later through ecosystem revenue, deposits, liquidity inflows, external capital, or treasury operations.
2. 30% of verified income is allocated to the reserve.
3. Operators prepare an income/reserve report using multi-source pricing when needed.
4. Governance reviews the report and approves expansion.
5. A role-holder calls `ReserveMintController.mintFromIncome(...)`.
6. The controller enforces:
   - caller has `RESERVE_REPORTER_ROLE`
   - controller is not paused
   - reported income is non-zero
   - evidence hash is non-zero
   - evidence hash has not been used before
   - cooldown has elapsed
   - xBGL minting occurs through `XBGLToken.MINTER_ROLE`

The on-chain minted amount is:

```text
incomeEurE18 * reserveShareBps / 10_000 * 1.955833
```

## Oracle Policy

Phase 1 does not implement automatic oracle-triggered minting. This is intentional.

Required off-chain oracle policy:

- Use multiple pricing sources for volatile assets.
- Treat USDC as $1 unless market stress requires override.
- Record feed IDs, timestamps, prices, and fallback use.
- Apply 7-30 day time-weighted reserve averaging.
- Reject reports with stale, missing, or materially divergent feeds.
- Store report artifacts so `evidenceHash` can be audited later.

Future phases may add stronger on-chain oracle aggregation once production oracle operations and monitoring exist.

## Governance and Roles

Phase 1 should use a multisig as the operational authority.

| Role | Contract | Capability |
| --- | --- | --- |
| `DEFAULT_ADMIN_ROLE` | `XBGLToken`, `ReserveMintController` | Grants/revokes roles and updates policy |
| `MINTER_ROLE` | `XBGLToken` | Allows approved contracts to mint |
| `PAUSER_ROLE` | `XBGLToken`, `ReserveMintController` | Emergency pause/unpause |
| `RESERVE_REPORTER_ROLE` | `ReserveMintController` | Submits approved income/reserve expansion reports |

Recommended mainnet control:

- `DEFAULT_ADMIN_ROLE`: multisig.
- `PAUSER_ROLE`: multisig or emergency multisig.
- `RESERVE_REPORTER_ROLE`: multisig only in Phase 1.
- `MINTER_ROLE`: only `ReserveMintController` during standalone xBGL testing.
- Future integration may grant `MINTER_ROLE` to an app/hub contract only after separate review.

## Emergency Controls

Emergency actions:

- Pause `XBGLToken` to freeze transfers and minting.
- Pause `ReserveMintController` to halt reserve expansion.
- Revoke `MINTER_ROLE` from compromised minters.
- Future integration may add land-sale or hub freeze controls, but those are outside the standalone xBGL sandbox.

Emergency triggers:

- Oracle failure or reserve report dispute.
- Treasury key compromise.
- Unauthorized mint attempt.
- Liquidity crisis.
- Governance signer compromise.

## Liquidity Model

Initial liquidity pairs:

- xBGL / AVAX
- xBGL / USDC

Principles:

- Prefer protocol-owned liquidity.
- Avoid excessive emissions.
- Lock LP positions where possible.
- Treat USDC pair as a reference market, not a peg.

## Demand and Sink Model

Structural demand sources:

- Infrastructure funding requirements.
- Land and planetary expansion systems.
- Treasury collateral needs.
- Governance participation locks.
- Strategic reserve holding.

Value sinks:

- Infrastructure deployment costs.
- Governance locking requirements.
- Ecosystem expansion fees.
- Treasury bond programs.
- Faction reserve requirements.

## On-chain / Off-chain Source of Truth

| Entity | Source of truth | Sync policy |
| --- | --- | --- |
| xBGL balances and supply | On-chain ERC-20 | Chain wins |
| Income/reserve reports | Off-chain governance artifacts | Hash committed on-chain |
| Treasury asset valuation | Off-chain oracle aggregation | Reviewed before controller call |
| Reserve expansion events | On-chain controller events | Indexed for audit |

App-specific entities such as land plots, deposits, and user-facing balances are out of scope until integration is selected.

## Security Invariants

- Genesis supply is minted once in the token constructor.
- No reserve expansion should occur while the reserve is empty.
- No xBGL minting without `MINTER_ROLE`.
- Reserve expansion minting must pass cooldown and unique evidence checks.
- 30% of verified income is the reserve allocation used for expansion.
- Expansion uses `1 EUR = 1.955833 xBGL` only as issuance math, not a peg.
- Every reserve expansion has a unique non-zero evidence hash.
- Reserve expansion is not automatic and cannot be triggered by a single oracle feed.
- Pausing the token blocks transfers and mints.
- xBGL does not expose redemption or peg functions.

## Verification

Run:

```bash
forge fmt --check
forge build
forge test -vvv
```

Current tests cover:

- Genesis supply and metadata.
- Role-gated minting.
- Income-to-reserve 30% allocation.
- EUR-to-xBGL issuance reference math.
- Reserve expansion cooldown.
- Pause behavior.

Existing hub tests may still exist in the repo for legacy Phase 1 flows, but the xBGL decision path should begin with `test/XBGLReservePolicy.t.sol`.

## Phase Evolution

### Phase 1

- Crypto-only reserve.
- 10B genesis supply.
- No initial reserve; reserve starts after land-sale income.
- Multisig governance.
- Off-chain reserve/oracle reports.
- Controlled on-chain expansion controller.

### Phase 2

- DAO governance introduction.
- More formal treasury automation.
- Stronger on-chain oracle aggregation.
- Optional timelock adoption.

### Phase 3

- Expanded reserve instruments.
- Optional real-world asset integrations.
- More advanced reconciliation and proof-of-reserve tooling.
