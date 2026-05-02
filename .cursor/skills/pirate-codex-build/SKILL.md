---
name: pirate-codex-build
description: Executes the Pirate Codex build track from idea to shipped product across Product, Tooling, Design, Systems, Security, and Shipping modules. Use when planning or implementing SaaS build work with structured progression checkpoints.
version: 0.1.0
last_reviewed: 2026-05-01
owner: octavia-core-team
quality_status: draft
---

# Pirate Codex Build

## Goal
Turn product ideas into a production-ready SaaS using six build modules with explicit checkpoints.

## Use This Skill When
- The user asks to build an MVP with clear staged progression.
- Work spans product scope, tooling, UX, backend, security, and release.
- The task benefits from a "module + lesson checkpoint" workflow.

## Module Sequence
1. Product
2. Tooling
3. Design
4. Systems
5. Security
6. Shipping

## Product Module
Lessons:
- Your Idea
- First Features
- Feature Planning
- Sprint Planning
- User Feedback
- Product Pricing

Execution checklist:
- [ ] State target user and painful problem.
- [ ] Define smallest valuable feature set.
- [ ] Split features into now/next/later.
- [ ] Write sprint scope with explicit non-goals.
- [ ] Define feedback channel and success signal.
- [ ] Draft an initial pricing hypothesis.

## Tooling Module
Lessons:
- Local Setup
- Cursor Agent
- Cursor Rules
- MCP Server
- AI Agents
- Payment Provider

Execution checklist:
- [ ] Local runbook works on a fresh machine.
- [ ] Agent workflows and prompts are repeatable.
- [ ] Project rules encode quality and safety constraints.
- [ ] Required MCP servers are linked and verified.
- [ ] Agent delegation boundaries are documented.
- [ ] Payment provider path is selected and tested in sandbox.

## Design Module
Lessons:
- Landing Page
- UI Components
- Style Systems
- User Flow
- Mobile Responsive
- Purchase Experience

Execution checklist:
- [ ] Landing page communicates value in one screen.
- [ ] Shared UI primitives are reused, not duplicated.
- [ ] Color/type/spacing tokens are consistent.
- [ ] Primary conversion flow is mapped end-to-end.
- [ ] Mobile behavior is verified for core screens.
- [ ] Purchase path has minimal friction and clear states.

## Systems Module
Lessons:
- Fixing Errors
- Real Functions
- Saving Data
- Login & Signup
- Webhook Integration
- Payment Gates

Execution checklist:
- [ ] Common failure states are detectable and recoverable.
- [ ] Business logic is moved to testable functions.
- [ ] Data writes are validated and observable.
- [ ] Authentication flow is stable and secure.
- [ ] Webhook handlers are idempotent and logged.
- [ ] Payment-gated features enforce access on trusted checks.

## Security Module
Lessons:
- Safety First
- Zero Trust
- Database Security
- Auth Security
- Webhook Security
- Payment Security

Execution checklist:
- [ ] Threat model notes exist for key surfaces.
- [ ] Trust is explicit; never assume trusted clients.
- [ ] DB access follows least privilege.
- [ ] Auth/session handling resists common abuse paths.
- [ ] Webhooks verify source and replay protection.
- [ ] Payment paths validate amount, identity, and status transitions.

## Shipping Module
Lessons:
- Going Live
- Debugging Flow
- Git Workflow
- Preview & Production
- Debug Production
- Public Changelog

Execution checklist:
- [ ] Release process is documented and rehearsed.
- [ ] Debug flow includes logs, traces, and rollback criteria.
- [ ] Branch/PR workflow is predictable and reviewable.
- [ ] Preview and production environments are separated.
- [ ] Production incident workflow has owner and timeline.
- [ ] Changelog communicates user-impacting changes.

## Output Contract
When this skill is used, return:
1. Current module and lesson checkpoint
2. Decisions made and why
3. Evidence of validation
4. Remaining risks and next checkpoint

## Guardrails
- Do not skip modules unless the user explicitly requests fast-tracking.
- For risky domains (auth, payments, DB permissions), route to specialized project skills before implementation.
- Prefer smallest testable increment per lesson.
