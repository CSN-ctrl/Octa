---
name: mcp-ops-safety-and-audit-trail
description: Adds operational safety controls for MCP-driven database and deployment actions, including approvals, preflight checks, and auditable change records. Use when running remote apply scripts, MCP payloads, or production-impact operations.
version: 0.1.0
last_reviewed: 2026-04-14
owner: octavia-core-team
quality_status: stable
---

# MCP Ops Safety and Audit Trail

## Goal
Reduce operational risk for high-impact automated actions.

## Use This Skill When
- Running scripts in `scripts/mcp`.
- Applying remote SQL payloads in `supabase/remote_apply`.
- Performing production changes with automation.

## Workflow
1. Classify operation risk (read-only, reversible write, destructive write).
2. Run preflight checks: target environment, credentials scope, backups, dry-run.
3. Require explicit approval for write/destructive actions.
4. Execute with step-level logging and failure stop points.
5. Capture post-run verification and rollback readiness.

## Output Format
- Operation summary and risk level
- Preflight checklist result
- Execution plan
- Audit record template
- Post-change verification and rollback steps

## Checklist
- [ ] Environment and project ID confirmed
- [ ] Secrets handled securely and minimally
- [ ] Dry-run output reviewed for write operations
- [ ] Audit record stored with operator and timestamp
- [ ] Rollback path tested or documented

## Guardrails
- Never run destructive operations without explicit user confirmation.
- Prefer small, reversible batches over large unbounded changes.

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
