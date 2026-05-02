---
name: deposit-auto-credit-mvp-hardening
description: Hardens the USDC deposit lifecycle from wallet address fetch to treasury-backed xBGL crediting with idempotency and user-visible status tracking. Use when changing deposit UI, usdc_deposits flows, treasury transfer RPCs, or transaction ingestion logic.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Deposit Auto Credit MVP Hardening

## Goal
Guarantee that a valid USDC deposit results in exactly one xBGL credit from treasury to the correct user account.

## Use This Skill When
- Updating `Deposit` page UX or status tracking.
- Changing `usdc_deposits` schema or confirmation logic.
- Modifying treasury transfer RPCs or transaction ingestion.

## Workflow
1. Verify hot-wallet fetch and fallback behavior.
2. Ensure deposit record creation is user-scoped and auditable.
3. Confirm server-side idempotent conversion path (source tx hash -> conversion tx hash).
4. Enforce atomic treasury debit + user credit and ledger write.
5. Show user-facing status transitions: pending -> confirmed/failed.

## Output Format
- Flow summary (UI -> DB -> ledger)
- Idempotency key strategy
- Security checks (ownership, auth, grants)
- Test matrix (duplicate, insufficient treasury, wrong user)

## Checklist
- [ ] Conversion is server-side, not client balance mutation
- [ ] Duplicate tx hash cannot double-credit
- [ ] User can only confirm own deposit
- [ ] Treasury balance guard blocks overdraft
- [ ] UI exposes status and actionable errors

## Skill Evolution

### Trigger Precision
- Primary triggers: deposit pipeline, treasury conversion, wallet fetch issues.
- Anti-triggers: unrelated dashboard or docs-only tasks.
- Required inputs: deposit UI file, hook, relevant SQL migration/function, and transaction schema.

### Feedback Hooks
- Record where conversion failed (auth, idempotency, funds, lookup).
- Add one concrete remediation step to the skill after incidents.

### KPI Snapshot
- Conversion success rate per week.
- Duplicate protection hit count.
- Mean confirmation-to-credit time.
- Deposit-related support tickets/regressions.
