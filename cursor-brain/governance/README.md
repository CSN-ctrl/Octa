# Governance Control Plane

This folder contains enforceable governance artifacts used by the
`prompt-execution-governor` loop.

## Files

- `decision-log-template.md`: canonical evidence-backed decision record.
- `run-score.schema.json`: scoring schema for task outcomes.
- `policy-gates.yaml`: blocking/approval rules by risk tier.
- `skill-routing-map.yaml`: required skill activation by domain/path.
- `telemetry/skill-activation-latest.json`: latest machine-readable skill activation trace.
- `telemetry/skill-activation-latest.md`: latest human-readable skill activation report.
- `governance-pack.json`: versioned pack manifest for dev/staging/prod rollout.
- `skill-lineage.json`: mutation and promotion lineage history.
- `regression-baseline.json`: temporal regression guard signatures.
- `chaos-drills.json`: scheduled fault-injection scenarios and due dates.
- `economic-safety-scenarios.json`: treasury/tokenomics simulation scenarios.

## Usage

1. For L2/L3 tasks, create or update a decision record using the template.
2. Emit run scores that validate against `run-score.schema.json`.
3. Evaluate policy gates before execution.
4. Use routing map to activate only required skills.
5. Emit skill activation trace (`npm run governance:skill-trace`) to show matched domains, activated skills, and skipped skills.
6. Update lineage and pack version on governance behavior changes.
7. Run temporal regression guard and chaos/economic hooks for risk-triggered changes.
8. Emit lineage telemetry to `cursor-brain/governance/telemetry/runs/` for each CI run.
