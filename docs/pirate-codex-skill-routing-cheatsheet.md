# Pirate Codex Skill Routing Cheat Sheet

This is a manual fallback for skill selection when automatic routing is ambiguous.

Use this after `prompt-execution-governor` and before implementation when a task needs explicit module targeting.

## Build Track

- Product discovery, MVP scope, sprint planning, pricing:
  - `pirate-codex-build-product`
- Local setup, Cursor workflows, rules, MCP setup, agent orchestration:
  - `pirate-codex-build-tooling`
- Landing page, component design, style systems, UX flow, responsive UI:
  - `pirate-codex-build-design`
- Backend functions, data saving, login/signup, webhook integration, payment gates:
  - `pirate-codex-build-systems`
- Threat model, zero trust, DB/auth hardening, webhook/payment security:
  - `pirate-codex-build-security`
- Release prep, preview vs production, debugging production, changelog:
  - `pirate-codex-build-shipping`

## Marketing Track

- AARRR planning, growth strategy, bottleneck prioritization:
  - `pirate-codex-marketing-strategy-roadmap`
- Positioning, story, messaging, channel voice, content cadence:
  - `pirate-codex-marketing-content-story`
- Funnel stages, landing page alignment, CRM workflows, acquisition flow:
  - `pirate-codex-marketing-funnel-building`
- KPI definitions, instrumentation, reporting, optimization loop:
  - `pirate-codex-marketing-data-analytics`
- Channel strategy, campaign structure, ad creative tests, scale rules:
  - `pirate-codex-marketing-traffic-generation`
- CRO backlog, website/email/ad tests, experiment sequencing:
  - `pirate-codex-marketing-conversion-optimization`

## Fallback Rules

- If task spans multiple build modules, use:
  - `pirate-codex-build`
- If task spans multiple marketing modules, use:
  - `pirate-codex-marketing`
- If both build and marketing are involved:
  - activate both track skills and ask for sequencing.

## Quick Prompt Patterns

- "Use product module to scope MVP pricing test":
  - `pirate-codex-build-product`
- "Set up campaign and ad creatives":
  - `pirate-codex-marketing-traffic-generation`
- "Improve conversion with website tests":
  - `pirate-codex-marketing-conversion-optimization`
- "Harden auth and payment security":
  - `pirate-codex-build-security`

