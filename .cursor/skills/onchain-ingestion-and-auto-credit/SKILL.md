---
name: onchain-ingestion-and-auto-credit
description: Operates and hardens the backend path that ingests onchain treasury deposits and auto-converts USDC deposits into xBGL treasury transfers with strict idempotency and audit metadata. Use when changing transactions ingestion, deposit automation triggers, or treasury conversion SQL.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Onchain Ingestion and Auto Credit

## Goal
Ensure that once an incoming treasury USDC transaction is ingested, conversion to xBGL is automatic, idempotent, and auditable.

## Use This Skill When
- Modifying ingestion from Alchemy or other chain indexers.
- Updating SQL triggers/functions on `transactions` and `usdc_deposits`.
- Investigating missed credits or duplicate credits.

## Workflow
1. Validate ingestion writes complete `transactions` rows (from, to, amount, token, tx hash, metadata).
2. Confirm trigger filtering (treasury destination + USDC-only) is correct.
3. Verify one-time conversion key (`source_tx_hash + _converted`) prevents duplicates.
4. Verify deposit row + treasury transfer ledger row are both written.
5. Review failure visibility and replay strategy.

## Output Format
- Ingestion coverage summary
- Trigger/processing filter matrix
- Idempotency and replay plan
- Monitoring checks and runbook updates

## Checklist
- [ ] Ingested deposit auto-converts without manual admin action
- [ ] Duplicate ingestion does not double-credit
- [ ] Treasury underflow blocks conversion safely
- [ ] Metadata links conversion to source tx hash
- [ ] Failed conversions are detectable and re-runnable

## Skill Evolution

### Trigger Precision
- Primary triggers: deposit ingestion, treasury conversion, tx replay issues.
- Anti-triggers: unrelated frontend UI-only changes.
- Required inputs: ingestion source code, trigger function SQL, conversion transaction rows.

### Feedback Hooks
- Record exact stage of failure: ingest, trigger filter, transfer, or ledger write.
- Add one concrete guardrail after each incident or postmortem.

### KPI Snapshot
- Auto-conversion success rate.
- Duplicate-suppression hit rate.
- Time from ingestion to credit.
- Unresolved conversion failures older than 15 minutes.
