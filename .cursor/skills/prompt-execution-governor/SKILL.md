---
name: prompt-execution-governor
description: Enforces Think-Plan-Decide-Execute-Verify-Learn with a Question Gate, token-efficient defaults, risk-tiered skill routing, and governance checks. Use for every prompt, especially when tasks touch migrations, auth/wallet, deposits/ledger, realtime flows, SEO, or production operations.
version: 0.2.0
last_reviewed: 2026-05-02
owner: octavia-core-team
quality_status: stable
---

# Prompt Execution Governor

## Goal
Run every task through a consistent operating loop that maximizes delivery quality while minimizing token/cost waste and safety regressions.

Primary loop:
- Think -> Plan -> Decide -> Execute -> Verify -> Learn

Question gate:
- Ask focused clarifying questions when ambiguity or risk is material.

## Always-On Rules
- Default to concise output.
- Scope work to minimal required files and tools.
- Use phased analysis: quick diagnosis -> focused action -> short verification.
- Do not proceed on high-risk assumptions; trigger Question Gate instead.
- Prefer the **smallest sufficient set** of specialized skills (still respecting risk-tier max); never skip specialized guidance when the repo or behavior changes.

## Mandatory skill selection (before Execute on mutations)
Applies whenever the task will **change** repo state (code, config, migrations, workflows, lockfiles, infra scripts).

1. **Route**: Use `cursor-brain/governance/skill-routing-map.yaml` — match **intent** + **paths** you will touch.
2. **Choose**: Prefer the **narrowest** matching skill (module before track). Name each specialized skill id you will follow.
3. **Read**: Open `.cursor/skills/<skill-id>/SKILL.md` for each specialized skill **before** editing; apply its checklist for this task.
4. **No skill found**: Search `.cursor/skills/*/SKILL.md` frontmatter `description:` lines for the best fit, **or** stop and ask the user which skill domain applies — **do not implement blind**.
5. **Governor-only exception**: Read-only Q&A with **zero** repo edits may rely on this skill alone **only if** you state explicitly that no specialized skill applies.

Canonical gate keys live under `skill_selection_gate` in the routing map.

## Detect (Think)
For each prompt, classify:
- Domain: ui, seo, auth-wallet, supabase-rls, migration, deposit-ledger, realtime, ops.
- Risk tier:
  - L0: low-risk docs/copy/small UI.
  - L1: medium feature work in one bounded domain.
  - L2: multi-domain or data-integrity sensitive.
  - L3: security, auth, ledger, migration, or prod-impact operations.
- Confidence score (0-100) for routing certainty.

## Plan
Produce a minimal plan with:
- Intended change scope.
- Explicit non-goals.
- Verification checks.
- Rollback/fallback note for L2/L3.

## Decide (Policy Gate)
If any condition fails, block execution and ask for clarification/approval:
- Confidence < 70 on L2/L3.
- Missing required skill for risky domain **or** undeclared / unread specialized skill when mutations are planned.
- Irreversible action requested without explicit user confirmation.
- Ledger/deposit flow lacks idempotency protections.
- Admin/security change lacks access-control review.

## Execute
Apply the smallest safe unit of work first, then iterate.

Token efficiency defaults:
- Limit explanations to actionable deltas.
- Avoid repo-wide scans unless required.
- Reuse previously established constraints instead of re-deriving.
- Keep active skill set small (2-3 max for L0/L1, up to 5 for L3).

## Verify
Verification output must include:
- What changed.
- Evidence checks run.
- Residual risks and assumptions.

## Learn
Log compact run metrics:
- safety_score
- correctness_score
- latency_score
- observability_score
- adoption_score
- violations
- outcome

Weighted score:
- run_score = 0.30*safety + 0.25*correctness + 0.15*latency + 0.15*observability + 0.15*adoption

### Evolve skills (required when reality diverges)
Skills are living documents. After work that proves a skill wrong, incomplete, or outdated:

1. Capture the gap in `cursor-brain/memory/failures.md` (what happened + which `skill-id`).
2. Patch the relevant `.cursor/skills/<skill-id>/SKILL.md` (and bump `metadata.version` / `last_reviewed` when present).
3. If routing should change, update `cursor-brain/governance/skill-routing-map.yaml`.

Playbook: `docs/skills-evolution.md`. Prefer small, high-signal edits over dumping chat logs into skills.

## Skill Routing (Conditional Activation)
Global activation:
- Always activate `prompt-execution-governor`.
- Always apply rules from `.cursor/rules/` with `alwaysApply: true`.

Hard triggers:
- `supabase/migrations/**` -> `supabase-rls-hardening-and-policy-design` + `supabase-rpc-ledger-idempotency-patterns`
- deposit/treasury/transactions paths -> `onchain-ingestion-and-auto-credit` + `deposit-auto-credit-mvp-hardening`
- auth/wallet/account linking paths -> `auth-wallet-identity-linking-playbook`
- `supabase/remote_apply` or production-impact ops -> `mcp-ops-safety-and-audit-trail`
- `.github/workflows/**` or `scripts/governance/**` -> `ci-quality-gates-for-risky-domains`
- contract + sandbox test paths (`src/contracts/**`, `docs/phase1-sandbox/**`) -> `foundry-sandbox-alignment-and-contract-test-porting`
- economy/treasury rule changes -> `game-economy-data-model-and-simulation-governance` + `supabase-rpc-ledger-idempotency-patterns`
- chain-state sync features -> `hybrid-onchain-offchain-sync-contract`

Soft triggers:
- large frontend service refactor -> `frontend-domain-service-modularization`
- broad architecture/doc drift -> `living-architecture-doc-curation`
- economy rule changes -> `game-economy-data-model-and-simulation-governance`

## Question Gate Standard
Ask questions when:
- multiple valid outcomes with meaningful trade-offs,
- scope boundaries are unclear,
- success criteria are missing,
- risk tier is L2/L3 and assumptions drive safety.

Question format:
- Decision
- Options
- Trade-off
- Default if no response

## Governance v3 Modules
Use these controls for continuous improvement:

1) Evidence-Backed Decision Logs
- Record assumptions, evidence links, and rejected alternatives for major decisions.

2) Invariant Compiler
- Keep domain invariants declarative and validate via executable checks (ledger/auth/deposit).

3) Chaos Drills
- Run scheduled fault injections to test detection, runbooks, and rollback quality.

4) Temporal Regression Guard
- Detect reintroduction of previously fixed defects and enforce preventive checks.

5) Skill Lineage Graph
- Track mutation history and explain KPI improvements/regressions per skill version.

6) Governance Pack Versioning
- Version policy + skills + gates as a single pack promoted through dev -> staging -> prod.

7) Risk-Weighted CI Matrix
- Expand/shrink CI checks by risk tier and impacted domains.

8) Human-in-the-Loop Escalation
- Trigger structured escalation when confidence is low or policy conflicts arise.

9) Economic Safety Simulator
- For treasury/tokenomics changes, run sink/faucet and solvency stress checks before merge.

## Mutation and Promotion (Evolve)
After each significant run:
- Generate one mutation candidate for weakest skill/policy area.
- Promote only if:
  - safety does not regress,
  - correctness >= 98,
  - run_score improves by >= 5 over baseline,
  - no critical violations in trial runs.
- Roll back mutation on critical violation or safety drop.

## Output Contract
Keep final responses compact and ordered:
0. **Skills**: domain match + specialized skill ids **read** (or explicit governor-only read-only exception)
1. Action summary
2. Key findings/changes
3. Verification evidence
4. Residual risks and next step

## Skill Coverage Requirement
The router must ensure every project skill is trigger-addressable via domain or path mapping when practical.
If a task has no explicit mapping but touches a risky domain, escalate to Question Gate and require explicit skill selection before execution.
If mapping is missing for a new area, add domains to `skill-routing-map.yaml` when you promote the workflow from `cursor-brain/patterns.md` or repeated failures.
