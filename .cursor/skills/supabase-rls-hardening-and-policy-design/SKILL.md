---
name: supabase-rls-hardening-and-policy-design
description: Designs and reviews Supabase RLS policies for least-privilege access across auth, wallet-linked identity, marketplace, and economy tables. Use when adding tables, changing policies, modifying RPCs that depend on table access, or reviewing data exposure risk.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Supabase RLS Hardening and Policy Design

## Goal
Create production-grade row-level security that enforces least privilege and prevents cross-user data leakage.

## Use This Skill When
- A migration adds or alters policies in `supabase/migrations` or `supabase/remote_apply`.
- A table is introduced for auth, wallet ownership, marketplace, ledger, faction, or economy data.
- An RPC or trigger changes who can read/write sensitive rows.

## Workflow
1. Inventory actors: `anon`, `authenticated`, `service_role`, and admin-like RPC paths.
2. Classify table sensitivity: public, user-private, role-restricted, system-only.
3. Define owner model: `auth.uid()`, wallet address, or service-controlled ownership.
4. Draft explicit `USING` and `WITH CHECK` predicates; avoid broad `true`.
5. Validate joins/subqueries in policies for performance and correctness.
6. Write verification SQL for allowed/denied access by role.

## Output Format
- Policy change summary
- Access matrix by actor and operation
- Proposed SQL policies
- Verification query pack
- Risk notes and rollback SQL

## Checklist
- [ ] No broad policy for sensitive tables
- [ ] `USING` and `WITH CHECK` both specified where needed
- [ ] Ownership rules match auth and wallet-linking model
- [ ] Service-only writes restricted to trusted path
- [ ] Tests include negative cases (cross-user reads/writes)
- [ ] Backfill/migration impact documented

## Guardrails
- Prefer deny-by-default and explicit allow paths.
- Keep policy logic readable; move complex logic to audited helper functions if required.
- Call out any temporary policy relaxation with an expiry plan.

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
