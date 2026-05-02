---
name: hybrid-onchain-offchain-sync-contract
description: Establishes source-of-truth and synchronization rules between Solidity contracts and Supabase-backed application state. Use when features touch ownership, land/city assets, wallet data, or any chain-backed entity mirrored in the database.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Hybrid Onchain Offchain Sync Contract

## Goal
Prevent state drift by defining explicit ownership and synchronization rules.

## Use This Skill When
- Contract ABI/address changes occur.
- New feature reads or writes both chain and Supabase state.
- Incident reports mention mismatch between wallet/chain and UI/database.

## Workflow
1. List entities and assign source of truth: onchain, offchain, or derived.
2. Define sync direction and trigger (event-driven, polling, manual backfill).
3. Specify conflict policy: chain-wins, db-wins, or operator-reviewed.
4. Document stale-data behavior and UX fallbacks.
5. Add observability: lag metrics, mismatch alerts, retry counts.
6. Create recovery plan for missed events or failed writes.

## Output Format
- Entity source-of-truth table
- Sync flow diagram (text is fine)
- Conflict resolution matrix
- Failure/retry policy
- Backfill/reconciliation procedure

## Checklist
- [ ] Every shared entity has a declared source of truth
- [ ] Event ordering and reorg handling considered
- [ ] Retry and dead-letter behavior defined
- [ ] User-visible behavior for stale data documented
- [ ] Reconciliation job/query available

## Guardrails
- Avoid implicit sync assumptions.
- Never silently overwrite authoritative state without auditability.

## Skill Evolution

### Trigger Precision
- Primary triggers: requests directly related to this skill's domain.
- Anti-triggers: generic tasks better handled by other skills.
- Required inputs: file paths, migration/PR scope, and risk context.

### Feedback Hooks
- If the result is weak, capture: missing context, wrong assumption, and skipped check.
- Propose one concrete instruction improvement before closing the task.

### KPI Snapshot
- Usage frequency: track weekly invocations.
- Success rate: tasks completed without major rework.
- Iteration count: retries needed to reach accepted output.
- Defect leakage: post-change issues tied to this domain.
