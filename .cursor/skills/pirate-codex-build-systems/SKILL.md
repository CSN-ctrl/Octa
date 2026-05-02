---
name: pirate-codex-build-systems
description: Executes the Pirate Codex Systems module for error handling, real business functions, persistence, authentication, webhook integration, and payment gates. Use when tasks involve backend behavior and application infrastructure.
version: 0.1.0
last_reviewed: 2026-05-01
owner: octavia-core-team
quality_status: draft
---

# Pirate Codex Build - Systems Module

## Lessons
- Fixing Errors
- Real Functions
- Saving Data
- Login & Signup
- Webhook Integration
- Payment Gates

## Workflow
1. Define expected failures and handling behavior.
2. Keep business logic in testable service functions.
3. Validate data persistence and recovery paths.
4. Implement robust auth/signup flows.
5. Make webhook handling idempotent and observable.
6. Gate paid features with trusted checks.

## Checklist
- [ ] Error states are explicit and recoverable.
- [ ] Core logic is testable outside UI.
- [ ] Data writes are validated and logged.
- [ ] Auth paths are stable.
- [ ] Webhooks are secure and idempotent.
- [ ] Payment gates enforce correct entitlement.

## Output Contract
Return:
1. Current lesson checkpoint
2. System decisions and architecture notes
3. Validation evidence
4. Next lesson/task
