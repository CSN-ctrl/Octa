---
name: auth-wallet-identity-linking-playbook
description: Guides safe identity linking between email auth accounts and wallet addresses, including canonical identity rules, conflict resolution, and migration safeguards. Use when touching login, account security, wallet connect, or user migration flows.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Auth Wallet Identity Linking Playbook

## Goal
Ensure one coherent identity model across auth users and wallet-linked ownership.

## Use This Skill When
- Updating login/reset/account security behavior.
- Adding wallet connect/link/unlink features.
- Running user migration or backfill scripts.

## Workflow
1. Define canonical user identity and allowed linked identifiers.
2. Specify linking preconditions (verified email, signed wallet proof).
3. Handle conflicts (wallet already linked, merged users, stale sessions).
4. Define unlink and recovery flows with security checks.
5. Add audit trail fields for link/unlink actions.

## Output Format
- Identity model
- Linking/unlinking state machine
- Conflict resolution rules
- Security controls and abuse cases
- Test matrix

## Checklist
- [ ] Canonical identity key is explicit
- [ ] Wallet ownership proof is validated server-side
- [ ] Conflicts fail safely with clear UX
- [ ] Recovery path exists for compromised account/wallet
- [ ] Migration scripts are idempotent and auditable

## Guardrails
- Do not trust client-only assertions for identity linkage.
- Treat link/unlink operations as security-sensitive events.

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
