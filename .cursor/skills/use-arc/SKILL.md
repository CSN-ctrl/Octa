---
name: use-arc
description: Provide implementation guidance for Circle Arc and Arc Testnet, where USDC is the native gas token. Use when Arc/Arc Testnet, USDC gas, deploy-to-Arc, or CCTP-to-Arc workflows are mentioned.
version: 0.1.0
last_reviewed: 2026-05-06
owner: octavia-core-team
quality_status: draft
---

# Use Arc

## Goal
Help developers build USDC-first applications on Arc with predictable fees and fast finality.

## Use This Skill When
- User mentions Arc or Arc Testnet.
- User asks about USDC as gas token.
- User asks to deploy contracts on Arc.
- User asks about bridging USDC to Arc via CCTP.
- User is building USDC-first payment or DeFi flows that target Arc.

## Workflow
1. Confirm target network: Arc mainnet or Arc testnet.
2. Define contract and account assumptions for USDC-as-gas execution.
3. Validate deployment configuration and chain identifiers.
4. Define funding/bridging strategy for USDC liquidity (including CCTP where relevant).
5. Add operational checks for fee predictability, confirmation latency, and failure handling.

## Checklist
- [ ] Network and chain configuration are explicit.
- [ ] USDC gas assumptions are documented in app + backend flows.
- [ ] Bridge/funding path is defined and testable.
- [ ] Contract deployment and verification steps are reproducible.
- [ ] Monitoring covers failed txs, stuck bridges, and gas-balance edge cases.

## Output Contract
Return:
1. Arc environment choice and assumptions
2. Deployment and funding plan
3. Integration risks and mitigations
4. Immediate next implementation steps
