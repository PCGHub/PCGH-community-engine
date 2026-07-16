# PCGH Backend

This is the PCGH Community Engine backend application.

## Stack

Next.js, TypeScript, Supabase — per `CLAUDE.md`'s `Backend` section and `docs/backend-architecture.md`'s "Application Stack." One documented exception: the AI Service (`app/ai/`) is a separate Python/FastAPI application, per `ADR-016` in `docs/architecture-decisions.md`.

## Status

This is a Repository Scaffold only (Phase 5, Step 1 — `docs/phase-5-roadmap.md`). It contains directory structure and placeholder documentation. No business logic, authentication logic, API endpoints, services, repositories, middleware, permissions, AI features, or payment logic have been implemented.

## Governing Documents

- `docs/backend-architecture.md`
- `docs/authentication-architecture.md`
- `docs/service-architecture.md`
- `docs/domain-architecture.md`
- `docs/application-architecture-freeze.md`
- `docs/implementation-playbook.md`
- `docs/phase-5-roadmap.md`
- `docs/documentation-governance-framework.md`
- `docs/architecture-decisions.md`

All application code consumes the `api` Supabase schema exclusively. No application code queries `identity`, `economy`, `discovery`, `protection`, `intelligence`, `analytics`, or `governance` directly.
