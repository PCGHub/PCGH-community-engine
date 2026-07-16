# PCGH Community Engine

# Backend Architecture

---

# Phase

Phase 4 — Application & Service Layer

---

# Status

✅ ACTIVE

Reviewed and approved by the Founder, 2026-07-15, per `docs/phase-4-completion.md`. Prior conflicts (backend stack, `domains/` folder) were resolved before approval — see that document's "Pre-Approval Architecture Consistency Pass."

---

# Purpose

This document defines the architecture of the PCGH backend application.

It establishes how the application communicates with the database, how services are organized, how business logic is implemented, and how external systems integrate with the platform.

This document governs all backend implementation.

---

# Mission

Build a scalable, secure, modular backend that faithfully implements the approved PCGH architecture without introducing undocumented business rules.

The backend is responsible for orchestrating workflows—not redefining them.

---

# Application Stack

The application backend is:

```text
Next.js
Supabase
TypeScript

Never JavaScript.
Always strict typing.
```

This is not a choice made by this document — it is `CLAUDE.md`'s `Backend` section, Level 1 and authoritative over every architecture document, restated here explicitly so this document is never again read as silent on stack. Every service, repository, and controller described below is implemented in this stack.

**One documented exception: the AI Service.**

```text
AI Service: Python + FastAPI
```

The AI Service is implemented as a separate, independently deployed Python/FastAPI application — the sole exception to the Next.js/TypeScript stack, adopted because Python's AI/ML ecosystem is the practical choice for AI orchestration work. It is not a second general-purpose backend:

- It does not share a runtime, process, or codebase with the Next.js backend.
- It communicates with the rest of the backend only through a defined internal API contract — never through shared in-process code, a shared ORM, or direct access to the same database connection pool.
- It still consumes the `api` schema for any data access, per "API Schema First" below, and remains bound by the same RLS and `service_role` rules as every other service (`docs/authentication-architecture.md`). Being a different language does not exempt it from the security model.
- It implements no business logic of its own beyond orchestration — per `docs/service-architecture.md`'s "AI Services," and `docs/phase-4-kickoff.md`'s "Out of Scope," AI-assisted decision-making features remain deferred pending ADR approval regardless of which language hosts the orchestration code.

This decision is recorded as `ADR-016` in `docs/architecture-decisions.md`.

---

# Core Philosophy

The backend follows six fundamental principles.

## 1. Database as Source of Truth

Business rules already implemented in the database remain authoritative.

Examples include:

- reputation
- cooldowns
- campaign rotation
- governance
- analytics
- feature flags

The backend consumes these rules.

It does not replace them.

---

## 2. API Schema First

The backend communicates with the database exclusively through the API schema whenever practical.

Application services should invoke:

- API Views
- API Functions
- API Procedures

rather than directly querying business schemas.

This creates a stable contract between the application layer and the database layer.

---

## 3. Thin API Layer

Controllers should remain lightweight.

Responsibilities:

- request validation
- authentication
- authorization
- calling services
- formatting responses

Controllers must never contain business logic.

---

## 4. Rich Service Layer

Business workflows belong inside application services.

Examples:

- campaign publishing
- payment orchestration
- notification workflows
- AI orchestration
- audit coordination

Services coordinate multiple operations while respecting existing database rules.

---

## 5. Modular Architecture

Each domain owns its own service boundary.

Modules communicate through documented interfaces.

No module may directly manipulate another module's internal implementation.

---

## 6. Governance Before Features

Every implementation must comply with:

- Documentation Governance Framework
- ADRs
- Implementation Playbook
- Schema Documentation

New architecture requires approval before implementation.

---

# High-Level Architecture

```text
                Web / Mobile Clients
                         │
                         ▼
                 Frontend (Next.js)
                         │
                         ▼
                 Backend API Layer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Authentication     Application      Background Jobs
                    Services
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  API Schema (Supabase)
                         │
                         ▼
              Business Schemas (001–009)
```

---

# Backend Modules

The backend is divided into domain-oriented services.

## Authentication Service

Responsibilities:

- login
- logout
- session validation
- JWT handling
- Supabase authentication
- role resolution

---

## Identity Service

Responsibilities:

- user profiles
- creator profiles
- community membership
- account lifecycle

Uses:

- identity schema

---

## Campaign Service

Responsibilities:

- campaign creation
- scheduling
- publishing
- closing
- archiving
- rotation orchestration

Uses:

- API procedures
- Economy
- Discovery
- Protection

---

## Discovery Service

Responsibilities:

- discovery opportunities
- assignment coordination
- campaign distribution
- exposure tracking

Uses:

- Discovery schema

---

## Protection Service

Responsibilities:

- exclusions
- cooldown monitoring
- rotation history
- abuse prevention

Uses:

- Protection schema

---

## Intelligence Service

Responsibilities:

- reputation
- badges
- achievements
- bonus orchestration

Uses:

- Intelligence schema

---

## Analytics Service

Responsibilities:

- dashboards
- reporting
- aggregated metrics

Uses:

- Analytics schema
- API views

---

## Governance Service

Responsibilities:

- feature flags
- AI controls
- system settings
- governance rules
- administrative overrides

Uses:

- Governance schema

---

## Notification Service

Responsibilities:

- email
- in-app notifications
- future push notifications

---

## Payment Service

Responsibilities:

- Flutterwave integration
- payment verification
- wallet operations
- bonus payouts

---

## Storage Service

Responsibilities:

- uploads
- media
- asset management

---

## AI Service

Responsibilities:

- AI orchestration
- prompt management
- future recommendation engines
- moderation support

AI features remain governed by feature flags.

Implementation: Python + FastAPI — the sole exception to this document's Next.js/TypeScript stack (see "Application Stack" above and `ADR-016`). Integrated with the rest of the backend via a defined internal API contract only; not a shared runtime or codebase.

---

# Folder Structure

```text
backend/
│
├── app/
│   ├── api/
│   ├── auth/
│   ├── domains/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── permissions/
│   ├── events/
│   ├── jobs/
│   ├── notifications/
│   ├── integrations/
│   ├── storage/
│   ├── ai/
│   ├── config/
│   └── utils/
│
├── tests/
│
├── scripts/
│
└── docs/
```

**`app/domains/` vs. `app/services/` — Domain Models vs. Domain Services:**

```text
app/domains/   Domain Models
               Per-domain type definitions, entities, and
               contracts, matching docs/domain-architecture.md's
               eleven domains one-to-one (identity, campaign,
               discovery, protection, intelligence, analytics,
               governance, notification, payment, ai, plus
               authentication as infrastructure). No business
               logic -- data shape only.

app/services/  Domain Services
               The service-layer code that orchestrates
               operations using the types defined in
               app/domains/, categorized per
               docs/service-architecture.md (Application,
               Domain, Infrastructure). Business workflow
               logic lives here, not in app/domains/.
```

The two are complementary, not duplicates: a domain's model lives in `app/domains/<domain>/`; the service that operates on it lives in `app/services/<domain>/`. Neither may substitute for the other, and `app/domains/` never contains a service, controller, or repository.

---

# Request Flow

```text
Client
    │
    ▼
Authentication
    │
    ▼
Authorization
    │
    ▼
Validation
    │
    ▼
Controller
    │
    ▼
Application Service
    │
    ▼
API Schema
    │
    ▼
Database
    │
    ▼
Response
```

---

# Background Jobs

The backend supports asynchronous processing for long-running tasks.

Examples:

- campaign distribution
- cooldown expiration
- bonus processing
- analytics aggregation
- notifications
- AI processing

Background jobs must remain idempotent and retry-safe.

---

# Event Flow

```text
Campaign Created
        │
        ▼
Campaign Distributed
        │
        ▼
Assignments Generated
        │
        ▼
Discovery Activity
        │
        ▼
Analytics Updated
        │
        ▼
Notifications Sent
        │
        ▼
Audit Recorded
```

---

# Security Model

The backend enforces:

- authentication
- authorization
- input validation
- API permissions
- Row Level Security
- audit logging
- governance controls

The backend never bypasses RLS except through approved SECURITY DEFINER routines.

---

# Error Handling

Errors should be:

- deterministic
- logged
- user-friendly
- traceable

Internal implementation details must never be exposed to clients.

---

# Observability

Every critical operation should produce:

- structured logs
- audit records
- metrics
- tracing identifiers

This area will be expanded during production readiness.

---

# External Integrations

Current:

- Supabase
- Flutterwave

Future:

- Email provider
- Object storage
- AI providers
- Monitoring platform

---

# Success Criteria

The backend architecture is considered complete when:

- service boundaries are defined
- authentication architecture is approved
- module ownership is documented
- request lifecycle is documented
- security model is documented
- integration strategy is documented

Only after approval may implementation begin.

---

# Relationship to Other Documents

This document works alongside:

- implementation-playbook.md
- documentation-governance-framework.md
- api-schema.md
- architecture-decisions.md

This document defines application architecture.

Those documents govern implementation.

---

# Document Status

Status: ACTIVE

Classification: Level 2 — Architecture

Owner: Founder / Chief Architect

Approved: 2026-07-15, per docs/phase-4-completion.md