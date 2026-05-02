---
name: game-economy-data-model-and-simulation-governance
description: Governs game economy schema and rule changes with simulation-first validation, sink/faucet balancing, and migration impact analysis. Use when changing marketplace, faction, NPC, automation, rewards, token sinks, or pricing logic.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# Game Economy Data Model and Simulation Governance

## Goal
Protect economy stability while enabling rapid iteration on gameplay and monetization loops.

## Use This Skill When
- Modifying economy tables or RPCs.
- Adding rewards, sinks, pricing, crafting, loot, or faction mechanics.
- Investigating inflation, exploit loops, or retention drops.

## Workflow
1. Define intended player loop and economy objective.
2. Map faucets, sinks, and velocity metrics.
3. Simulate short and long horizons (new, mid, whale cohorts).
4. Validate exploit resistance and anti-pay-to-win constraints.
5. Ship with telemetry thresholds and rollback triggers.

## Output Format
- Economy change brief
- Faucet/sink table
- Simulation assumptions and outcomes
- Risk scenarios and mitigations
- Launch guardrails and monitoring plan

## Checklist
- [ ] Every new faucet has balancing sink strategy
- [ ] Progression pacing is validated across cohorts
- [ ] Edge cases include botting and resource hoarding
- [ ] Telemetry events capture key economy KPIs
- [ ] Rollback or hotfix plan prepared

## Guardrails
- Avoid economy changes without measurable hypotheses.
- Treat exploit prevention and fairness as release blockers.

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
