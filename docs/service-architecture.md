# Service Architecture

Status:
LOCKED

Phase:
Phase 4

Hierarchy Level:
Level 2 — Architecture

---

# Purpose

This document defines how backend services are categorized, bounded, and governed for the PCGH Community Engine. It elaborates `docs/backend-architecture.md`'s "Backend Modules" and "Core Philosophy" sections into concrete service-design rules. It introduces no service, responsibility, or module not already named in `docs/backend-architecture.md`.

---

# Service Philosophy

Per `docs/backend-architecture.md`'s Core Philosophy, restated here as service-design law:

```text
1. Database as Source of Truth
   Business rules already implemented in the database
   (reputation, cooldowns, rotation, governance, analytics,
   feature flags) remain authoritative. Services consume
   them; they do not reimplement or duplicate them.

2. API Schema First
   Services call api.* views, functions, and procedures.
   They do not query identity, economy, discovery,
   protection, intelligence, analytics, or governance
   directly.

3. Thin Controllers, Rich Services
   Controllers validate, authenticate, authorize, call a
   service, and format the response. All business workflow
   coordination lives in the service layer.

4. Modular Architecture
   Each domain owns its own service boundary. No service
   reaches into another service's internal implementation.

5. Governance Before Features
   Every service complies with the Documentation Governance
   Framework, approved ADRs, the Implementation Playbook,
   and schema documentation before any new capability is
   added.
```

---

# Service Categories

Services fall into four categories. Every service named in `docs/backend-architecture.md`'s "Backend Modules" section is placed into exactly one category below; no category introduces a service not already named there.

```text
Application Services  -- orchestrate workflows across domains
Domain Services       -- own one business schema's application logic
Infrastructure Services -- cross-cutting, own no business schema
Integration Services  -- external third-party system connectors
                         (a responsibility carried by specific
                         Application/Infrastructure services,
                         not a separate service tier)
```

---

# Application Services

Services that coordinate multi-step workflows spanning more than one domain, matching `docs/backend-architecture.md`'s "Rich Service Layer" examples (campaign publishing, payment orchestration, notification workflows, AI orchestration, audit coordination):

```text
Campaign Service
  Uses: API procedures, Economy, Discovery, Protection
  (economy.campaigns / campaign_asset / campaign_distributions
  for the campaign side; discovery and protection are engaged
  through api.distribute_campaign() / rotate_campaign() /
  close_campaign() / archive_campaign() / restore_campaign())

Payment Service
  Uses: Economy (economy.credit_wallets, credit_transactions),
  Flutterwave integration
  (wallet operations and bonus payouts; economy.campaigns
  remains owned by Campaign Service -- see Domain Architecture
  for the exact Economy schema split)

Notification Service
  Uses: Event Flow outputs (Campaign Distributed, Discovery
  Activity, Bonus Granted, etc.), Email integration (future)

AI Service
  Uses: governance.feature_flags, governance.ai_controls
  (orchestration and prompt management only; all AI features
  remain disabled by default per seed data, 009, and governed
  by feature flags, per ADR 006)
```

---

# Domain Services

Services that own the application-layer logic for exactly one business schema, matching `docs/backend-architecture.md`'s per-module descriptions one-to-one:

```text
Identity Service      -- identity schema
Discovery Service     -- discovery schema
Protection Service    -- protection schema
Intelligence Service  -- intelligence schema
Analytics Service     -- analytics schema
Governance Service    -- governance schema
```

---

# Infrastructure Services

Cross-cutting services that own no business schema and no business rule of their own — they support every domain rather than representing one:

```text
Authentication Service
  Per docs/authentication-architecture.md. Resolves identity
  and role membership for every other service; owns no
  business schema.

Storage Service
  Uploads, media, and asset management (per
  docs/backend-architecture.md). No business schema of its
  own -- it is consumed by domains that need to attach media
  (e.g. economy.campaign_asset's content_url / thumbnail_url),
  but does not itself own campaign, identity, or any other
  business data. Storage is infrastructure, not a domain --
  this is why docs/domain-architecture.md has no dedicated
  "Storage Domain" section, and why Phase 5 Step 2 (Core
  Infrastructure), not a dedicated later step, is where its
  scaffolding belongs (docs/phase-5-roadmap.md).
```

---

# Integration Services

Per `docs/backend-architecture.md`'s "External Integrations" section:

```text
Current:
  Supabase   -- database, auth, and API layer (all services)
  Flutterwave -- payment processing (Payment Service)

Future:
  Email provider       -- Notification Service
  Object storage       -- Storage Service
  AI providers         -- AI Service
  Monitoring platform  -- cross-cutting, all services
```

Integration is a responsibility carried by the relevant Application or Infrastructure service, not a separate service tier — there is no standalone "Integration Service" module in `docs/backend-architecture.md`'s Backend Modules list, and this document does not invent one.

---

# Service Responsibilities

Restated verbatim from `docs/backend-architecture.md`'s "Backend Modules" section — this document does not redefine any service's responsibilities, only its category (above) and its dependency/transaction rules (below). See `docs/backend-architecture.md` for the authoritative per-service responsibility list.

---

# Dependency Rules

```text
A service may call:
  - The api schema (views, functions, procedures)
  - Its own domain's already-approved logic
  - Infrastructure services (Authentication, Storage)
  - Application services, only through documented
    service interfaces, never their internals

A service may not:
  - Query a business schema directly
  - Reach into another service's internal state or
    private data structures
  - Duplicate a business rule already implemented in the
    database (per "Database as Source of Truth")
  - Bypass Row Level Security under any circumstance
```

Domain Services do not call each other directly. Where a workflow needs more than one domain (e.g. distributing a campaign, which touches Economy, Discovery, and Protection), that coordination belongs to an Application Service (Campaign Service), which itself still only calls `api.*` objects — it does not reach into Discovery Service's or Protection Service's internals either.

---

# Transaction Boundaries

Transaction boundaries are established by the API layer's stored procedures, not by application-layer service code. A service completing a multi-step business operation calls one `api.*` procedure (e.g. `api.distribute_campaign()`, `api.close_campaign()`, `api.create_performance_bonus()`) and relies on the database's own transactional guarantees for that operation's atomicity, rather than orchestrating multiple separate database calls from application code and attempting to manage a distributed transaction itself.

If a workflow genuinely needs a new multi-step atomic operation the API schema doesn't yet expose, that is a new stored procedure — an Architecture Change Lifecycle proposal (`docs/documentation-governance-framework.md` §5a) — not something an application service should assemble itself from smaller calls.

---

# Error Handling

Per `docs/backend-architecture.md`'s Error Handling section:

```text
Errors are deterministic, logged, user-friendly, and
traceable. Internal implementation details (table names,
policy names, function names, stack traces) are never
exposed to clients.
```

---

# Logging

Per `docs/backend-architecture.md`'s Observability section:

```text
Every critical operation should produce structured logs,
audit records, metrics, and tracing identifiers.
```

`docs/backend-architecture.md` explicitly defers the detailed specification of this area to production readiness work; this document does not invent one ahead of that.

---

# Events

Per `docs/backend-architecture.md`'s Event Flow:

```text
Campaign Created
        ↓
Campaign Distributed
        ↓
Assignments Generated
        ↓
Discovery Activity
        ↓
Analytics Updated
        ↓
Notifications Sent
        ↓
Audit Recorded
```

The underlying event store is `analytics.analytics_events` (migration 006), already implemented with a governed `event_type` vocabulary. Services do not invent new event types outside that vocabulary without an Architecture Change Lifecycle proposal to extend it.

---

# AI Services

Per `docs/backend-architecture.md`'s AI Service module ("AI orchestration, prompt management, future recommendation engines, moderation support... AI features remain governed by feature flags") and `docs/phase-4-kickoff.md`'s "Out of Scope" section:

```text
In scope now:  AI orchestration/integration plumbing only
Out of scope:  AI-assisted campaign distribution,
               predictive analytics, autonomous moderation,
               experimental recommendation engines --
               all deferred pending ADR approval
```

Every AI feature flag seeded in `governance.feature_flags` and every control seeded in `governance.ai_controls` (migration 009) is disabled by default. No service may enable AI-driven behavior by default or bypass this governance.

---

# Testing Strategy

Per `docs/phase-4-kickoff.md`'s Testing scope and `docs/implementation-playbook.md`'s Definition of Done:

```text
Unit testing
Integration testing
Security testing
Performance testing
User acceptance testing
```

A service is not "done" when it type-checks — per the Implementation Playbook, it must be exercised end-to-end, not just statically verified.

---

# Directory Layout

Per `docs/backend-architecture.md`'s Folder Structure, with services organized by the categories above (illustrative; not created by this document):

```text
backend/app/services/
├── campaign/        (Application)
├── payment/         (Application)
├── notification/    (Application)
├── ai/              (Application)
├── identity/        (Domain)
├── discovery/        (Domain)
├── protection/       (Domain)
├── intelligence/     (Domain)
├── analytics/        (Domain)
├── governance/        (Domain)
├── auth/            (Infrastructure -- see authentication-architecture.md)
└── storage/         (Infrastructure)
```

---

# Implementation Rules

Per `docs/implementation-playbook.md`, restated here:

```text
Every service consumes the api schema exclusively

No new business logic without an approved ADR

Never bypass RLS or expose service_role to a client

Never silently work around an open ADR
(ADR-013, ADR-014, ADR-015)

Every service is exercised end-to-end before being
considered done
```

---

# Success Criteria

This architecture is ready for implementation when:

```text
Service categories are defined            -- done, above
Every backend-architecture.md module is placed in
  exactly one category                    -- done, above
Dependency rules are defined              -- done, above
Transaction boundary policy is defined    -- done, above
Reviewed and approved by Founder / Chief Architect
```
