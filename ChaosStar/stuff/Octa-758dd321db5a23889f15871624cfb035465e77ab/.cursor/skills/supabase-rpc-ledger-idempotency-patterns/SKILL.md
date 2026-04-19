---
name: supabase-rpc-ledger-idempotency-patterns
description: Defines safe SQL RPC patterns for token and treasury operations with idempotency, race protection, and invariants. Use when changing token transfer, mint, burn, treasury, or balance reconciliation RPCs and migrations.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Supabase RPC Ledger Idempotency Patterns

## Goal
Guarantee financial correctness under retries, duplicates, and concurrent execution.

## Use This Skill When
- Editing token or treasury RPC SQL.
- Adding transaction hash semantics or request IDs.
- Fixing double-credit/debit bugs.

## Core Invariants
- Balance never goes negative unless explicitly allowed.
- Sum of debits and credits remains consistent with supply rules.
- Same transaction identifier cannot apply effects twice.
- Failed operation leaves no partial state.

## Workflow
1. Define idempotency key (`tx_hash`, `request_id`, or composite key).
2. Wrap operation in a transaction with clear failure behavior.
3. Use row locks or advisory locks for critical account/treasury rows.
4. Write once-only marker insertion before side effects.
5. Return deterministic output for duplicate retries.
6. Add reconciliation query and anomaly detection checks.

## Output Format
- RPC contract (inputs, outputs, idempotency key)
- SQL changes
- Concurrency strategy
- Test matrix (retry/duplicate/race/failure)
- Rollback and recovery notes

## Checklist
- [ ] Idempotency key is unique and persisted
- [ ] Duplicate call returns safe, stable result
- [ ] Concurrency tests include same-account race
- [ ] No partial writes on exceptions
- [ ] Reconciliation query provided

## Guardrails
- Never rely on client-only dedupe for monetary operations.
- Treat retry behavior as a first-class API requirement.

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
