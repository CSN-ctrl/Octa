# Skill Activation Trace

- Generated at: 2026-04-15T19:49:51.735Z
- Changed files: 3
- Activated skills: 9

## Activated Skills

- auth-wallet-identity-linking-playbook
- ci-quality-gates-for-risky-domains
- deposit-auto-credit-mvp-hardening
- hybrid-onchain-offchain-sync-contract
- mcp-ops-safety-and-audit-trail
- onchain-ingestion-and-auto-credit
- prompt-execution-governor
- supabase-rls-hardening-and-policy-design
- supabase-rpc-ledger-idempotency-patterns

## Domain Matches

### deposit_ledger

- Required skills: onchain-ingestion-and-auto-credit, deposit-auto-credit-mvp-hardening, supabase-rpc-ledger-idempotency-patterns, hybrid-onchain-offchain-sync-contract
- Trigger: `supabase/functions/ingest-treasury-deposits/**`
  - supabase/functions/ingest-treasury-deposits/index.ts

### auth_wallet

- Required skills: auth-wallet-identity-linking-playbook, supabase-rls-hardening-and-policy-design
- Trigger: `src/pages/Login.tsx`
  - src/pages/Login.tsx

### ops_remote_apply

- Required skills: mcp-ops-safety-and-audit-trail
- Trigger: `scripts/**`
  - scripts/governance/skill-activation-trace.mjs

### ci_and_release

- Required skills: ci-quality-gates-for-risky-domains
- Trigger: `scripts/governance/**`
  - scripts/governance/skill-activation-trace.mjs

## Skipped Skills

- foundry-sandbox-alignment-and-contract-test-porting: no matching domain trigger in changed files
- frontend-domain-service-modularization: no matching domain trigger in changed files
- game-economy-data-model-and-simulation-governance: no matching domain trigger in changed files
- living-architecture-doc-curation: no matching domain trigger in changed files
