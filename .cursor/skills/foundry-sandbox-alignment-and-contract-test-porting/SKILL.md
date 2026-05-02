---
name: foundry-sandbox-alignment-and-contract-test-porting
description: Aligns documented smart contract testing workflows with actual repository state and ports missing tests into executable Foundry suites. Use when Solidity contracts change or when docs and test reality diverge.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Foundry Sandbox Alignment and Contract Test Porting

## Goal
Make contract quality claims verifiable by executable tests in-repo.

## Use This Skill When
- Updating Solidity contracts in `src/contracts`.
- Working on contract docs that describe tests not present in CI.
- Preparing for deployment or security review.

## Workflow
1. Compare documented test claims vs actual runnable tests.
2. Identify minimum critical contract behaviors to cover first.
3. Port or create Foundry tests for highest-risk paths.
4. Add deterministic fixtures and edge-case scenarios.
5. Define CI entry point for contract test execution.

## Output Format
- Gap report (docs vs runnable tests)
- Prioritized test backlog
- Test implementation plan
- CI integration notes

## Checklist
- [ ] Access control and permission tests present
- [ ] Monetary/state transition invariants tested
- [ ] Revert/error paths covered
- [ ] Deployment and upgrade assumptions validated
- [ ] Test commands documented and reproducible

## Guardrails
- Prioritize critical invariants over broad but shallow test volume.
- Keep tests deterministic and independent.

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
