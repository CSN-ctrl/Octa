---
name: frontend-domain-service-modularization
description: Refactors large frontend service layers into bounded domain modules with stable interfaces, incremental migration steps, and regression safety checks. Use when supabase-service or similar files grow across multiple unrelated domains.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Frontend Domain Service Modularization

## Goal
Reduce change risk and improve testability by splitting monolithic services into domain-focused modules.

## Use This Skill When
- A service file mixes auth, economy, marketplace, automation, and ledger logic.
- A PR modifies unrelated sections in one large service file.
- Regression frequency rises after service changes.

## Workflow
1. Identify bounded contexts and API seams.
2. Define target module map and shared utility boundaries.
3. Introduce facades/adapters to preserve call sites during migration.
4. Move one domain at a time with tests.
5. Deprecate legacy exports after migration window.

## Output Format
- Current pain points
- Proposed module boundaries
- Migration sequence (safe incremental steps)
- Test strategy
- Rollback plan

## Checklist
- [ ] No cross-domain imports that re-couple modules
- [ ] Public interfaces documented per module
- [ ] Existing callers remain stable during transition
- [ ] Domain tests pass before next extraction
- [ ] Legacy facade cleanup tracked

## Guardrails
- Prefer incremental extraction over big-bang rewrites.
- Keep behavior identical before optimization/refactoring enhancements.

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
