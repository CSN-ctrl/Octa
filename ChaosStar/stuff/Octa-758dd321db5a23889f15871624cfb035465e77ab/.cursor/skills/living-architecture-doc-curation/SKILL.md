---
name: living-architecture-doc-curation
description: Maintains a coherent, current architecture documentation set by enforcing canonical sources, archival rules, and drift checks. Use when major features ship, runbooks multiply, or onboarding confusion indicates doc fragmentation.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Living Architecture Doc Curation

## Goal
Keep documentation accurate, discoverable, and aligned with running code.

## Use This Skill When
- New runbooks or `*_COMPLETED.md` files are added.
- Onboarding requires many conflicting docs.
- Release cycles reveal stale architecture notes.

## Workflow
1. Build an inventory of architecture and operations docs.
2. Mark canonical docs per domain (auth, economy, blockchain, infra).
3. Archive or annotate stale docs with clear status.
4. Add a lightweight update cadence and ownership.
5. Link docs to code entry points and verification commands.

## Output Format
- Canonical docs index
- Stale/duplicate docs list
- Merge/archive recommendations
- Ownership and review cadence

## Checklist
- [ ] Each domain has one primary architecture doc
- [ ] Deprecated docs are clearly marked
- [ ] Operational runbooks have last-verified date
- [ ] Critical docs include validation steps
- [ ] New docs follow naming and placement conventions

## Guardrails
- Favor fewer canonical documents over many overlapping summaries.
- Ensure claims in docs map to executable code/tests/scripts.

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
