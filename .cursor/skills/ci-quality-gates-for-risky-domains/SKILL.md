---
name: ci-quality-gates-for-risky-domains
description: Designs CI checks based on risk level for auth, SQL migrations, wallet/blockchain integration, and economy-critical code. Use when updating workflows, introducing migrations, or raising release confidence for sensitive project areas.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# CI Quality Gates for Risky Domains

## Goal
Apply stronger verification where breakage is most expensive.

## Use This Skill When
- Editing `.github/workflows`.
- Changing SQL migrations, auth flows, token logic, or wallet/contract integrations.
- Defining release readiness policy.

## Workflow
1. Classify paths by risk (critical, high, normal).
2. Map required checks to each risk class.
3. Add path-based CI jobs for targeted validation.
4. Enforce minimum checks before merge.
5. Track flaky tests and stabilize instead of bypassing.

## Output Format
- Risk-class matrix
- Required checks per class
- Workflow changes
- Rollout plan and failure policy

## Suggested Critical Checks
- Typecheck and unit tests for changed critical modules
- SQL lint/validate and migration dry-run checks
- Security/static checks for contract-facing code
- Build and smoke validation

## Checklist
- [ ] Critical paths cannot merge without required checks
- [ ] Coverage expectations for critical modules are explicit
- [ ] Migration failures block merge
- [ ] Fast feedback path exists for non-critical changes

## Guardrails
- Favor deterministic checks over noisy gates.
- Avoid global slow pipelines when path-based checks can target risk.

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
