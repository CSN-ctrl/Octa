# Project Skills Index

This index maps project skills to common workflows in this repository.

## Quick Start

- Always-on execution/routing/cost governance: start with `prompt-execution-governor`.
- Security and data-access changes: start with `supabase-rls-hardening-and-policy-design`.
- Token, treasury, and balance logic: start with `supabase-rpc-ledger-idempotency-patterns`.
- Chain + database state features: start with `hybrid-onchain-offchain-sync-contract`.
- Large frontend service edits: start with `frontend-domain-service-modularization`.
- Release confidence and CI tightening: start with `ci-quality-gates-for-risky-domains`.

## Skills and Use Cases

### `prompt-execution-governor`
- Use for: every prompt as the default execution loop and policy/cost router.
- Typical outputs: Think-Plan-Decide-Execute-Verify-Learn flow, Question Gate decisions, risk-tier skill activation, and compact evidence-first summaries.

### `supabase-rls-hardening-and-policy-design`
- Use for: new tables, policy updates, RPC access review.
- Typical outputs: access matrix, policy SQL, verification queries, rollback SQL.

### `supabase-rpc-ledger-idempotency-patterns`
- Use for: token transfer, mint, burn, treasury RPC changes.
- Typical outputs: invariants, idempotency key strategy, race/retry test matrix.

### `hybrid-onchain-offchain-sync-contract`
- Use for: wallet ownership, registry sync, onchain/offchain mismatch fixes.
- Typical outputs: source-of-truth table, conflict policy, recovery/backfill plan.

### `frontend-domain-service-modularization`
- Use for: refactoring monolithic frontend service files.
- Typical outputs: module boundaries, migration steps, regression guard plan.

### `ci-quality-gates-for-risky-domains`
- Use for: `.github/workflows` updates and risk-based quality checks.
- Typical outputs: risk-class matrix, required checks, rollout plan.

### `auth-wallet-identity-linking-playbook`
- Use for: login/account security/wallet link-unlink flows and user migration.
- Typical outputs: identity model, conflict handling, security test matrix.

### `game-economy-data-model-and-simulation-governance`
- Use for: rewards, sinks/faucets, pricing, marketplace and progression tuning.
- Typical outputs: economy simulation assumptions, KPI thresholds, rollback triggers.

### `mcp-ops-safety-and-audit-trail`
- Use for: `scripts/mcp` and `supabase/remote_apply` operations.
- Typical outputs: preflight checklist, approval gates, audit trail, rollback steps.

### `foundry-sandbox-alignment-and-contract-test-porting`
- Use for: Solidity changes and test-doc drift reconciliation.
- Typical outputs: docs-vs-tests gap report, prioritized test backlog, CI test entrypoint.

### `living-architecture-doc-curation`
- Use for: keeping architecture/runbooks current and non-duplicative.
- Typical outputs: canonical docs map, stale-doc archive plan, review cadence.

### `deposit-auto-credit-mvp-hardening`
- Use for: deposit page lifecycle, tx-hash confirmation, and treasury-backed xBGL auto-credit flow.
- Typical outputs: idempotency strategy, conversion safety checks, and status UX validation.

### `onchain-ingestion-and-auto-credit`
- Use for: backend transaction ingestion and automatic USDC deposit conversion via DB triggers.
- Typical outputs: ingest-to-credit audit chain, duplicate suppression checks, and replay/runbook guidance.

## Workflow Playbooks

### New Feature (Web2 + Web3 touchpoints)
1. `hybrid-onchain-offchain-sync-contract`
2. `supabase-rls-hardening-and-policy-design`
3. `frontend-domain-service-modularization`
4. `ci-quality-gates-for-risky-domains`

### Economy or Gamification Update
1. `game-economy-data-model-and-simulation-governance`
2. `supabase-rpc-ledger-idempotency-patterns`
3. `ci-quality-gates-for-risky-domains`

### Security Hardening Sprint
1. `supabase-rls-hardening-and-policy-design`
2. `supabase-rpc-ledger-idempotency-patterns`
3. `auth-wallet-identity-linking-playbook`
4. `mcp-ops-safety-and-audit-trail`

### Incident Response (Data Drift or Balance Anomaly)
1. `hybrid-onchain-offchain-sync-contract`
2. `supabase-rpc-ledger-idempotency-patterns`
3. `mcp-ops-safety-and-audit-trail`
4. `living-architecture-doc-curation`

## Maintenance

- Keep skill descriptions aligned with current architecture and directory layout.
- Review this index after major auth, economy, contract, or CI pipeline changes.

## Continuous Evolution Loop

Use `SKILL_EVOLUTION_LOG.md` to continuously tune skills.

1. After each major task, log outcome and missing guidance.
2. During weekly review, update low-performing skills first.
3. Bump `version` and refresh `last_reviewed` when behavior changes.
4. Mark weak or overlapping skills as `deprecated` before removal.
