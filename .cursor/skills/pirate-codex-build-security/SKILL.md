---
name: pirate-codex-build-security
description: Executes the Pirate Codex Security module for safety-first threat thinking, zero-trust access, database security, auth hardening, webhook verification, and payment security. Use when tasks involve security controls or sensitive data paths.
version: 0.1.0
last_reviewed: 2026-05-01
owner: octavia-core-team
quality_status: draft
---

# Pirate Codex Build - Security Module

## Lessons
- Safety First
- Zero Trust
- Database Security
- Auth Security
- Webhook Security
- Payment Security

## Workflow
1. Identify threat surfaces and abuse cases.
2. Apply least privilege and zero-trust assumptions.
3. Review database access controls and exposure.
4. Harden auth/session handling.
5. Verify webhook signatures and replay protection.
6. Validate payment state transitions and identity checks.

## Checklist
- [ ] Threat model and assumptions are explicit.
- [ ] Access controls follow least privilege.
- [ ] Auth flows are resistant to misuse.
- [ ] Webhook source and replay checks are enforced.
- [ ] Payment security checks are complete.

## Output Contract
Return:
1. Current lesson checkpoint
2. Security decisions and residual risks
3. Validation evidence
4. Next lesson/task
