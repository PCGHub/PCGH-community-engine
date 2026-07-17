# Phase 5 Roadmap

Status:
COMPLETE — all 15 steps implemented and reviewed; see "Roadmap
Status" below and `docs/phase-5-completion.md`

Phase:
Phase 5 — Application Implementation

Note:
This roadmap was originally drafted as "Phase 4 Roadmap." It is
renamed to Phase 5 to match `docs/phase-4-completion.md`'s framing:
Phase 4 was Application *Architecture* (now complete); Phase 5 is
Application *Implementation*, beginning with Repository Scaffolding
as Step 1. This mirrors the project's existing Phase 1→2 (design)
then Phase 3 (implementation) pattern. Step content, dependencies,
and exit criteria are unchanged — only the phase label moved.

Hierarchy Level:
Level 2 — Architecture

Source of truth for step content:
docs/backend-architecture.md, docs/authentication-architecture.md,
docs/service-architecture.md, docs/domain-architecture.md,
docs/application-architecture-freeze.md, docs/implementation-playbook.md

---

# STEP 1

## Repository Scaffold

**Objective**

Create the backend repository skeleton exactly as defined by the approved Backend, Authentication, Service, and Domain Architecture — directories, config skeletons, and placeholder files only. No executable business logic.

**Deliverables**

```text
backend/app/{api,auth,services,repositories,middleware,
permissions,events,jobs,notifications,integrations,storage,
ai,config,utils}/ directories

backend/app/services/{campaign,payment,notification,ai,
identity,discovery,protection,intelligence,analytics,
governance}/ subdirectories (per docs/service-architecture.md
categories)

backend/tests/, backend/scripts/, backend/docs/

README and configuration skeletons per directory, where
docs/backend-architecture.md specifies one
```

**Dependencies**

`docs/application-architecture-freeze.md` ratified (Founder/Chief Architect review complete); `docs/backend-architecture.md`, `docs/service-architecture.md`, `docs/domain-architecture.md`, `docs/authentication-architecture.md` all approved.

**Exit Criteria**

```text
Scaffold matches the approved architecture without deviation
No executable business logic, authentication logic, API
  endpoints, services, repositories, middleware,
  permissions, AI features, or payment logic present
Any conflict discovered during scaffolding was documented
  and escalated, not resolved unilaterally
```

---

# STEP 2

## Core Infrastructure

**Objective**

Stand up configuration, environment, the Supabase client, base logging/observability scaffolding, and the Storage Service's infrastructure connection. Storage and AI infrastructure plumbing is scaffolded here, not as separate later steps — see `docs/domain-architecture.md` and `docs/service-architecture.md` for why both are infrastructure rather than business domains.

**Deliverables**

```text
Configuration module (environment variables, secrets
  handling -- service_role key server-side only)
Supabase client wrapper (shared by every service)
Base structured logging setup
Storage Service infrastructure connection (object storage,
  per docs/backend-architecture.md's External Integrations)
AI Service infrastructure connection (orchestration plumbing
  only -- no AI feature logic; all governance.ai_controls /
  feature_flags rows remain disabled)
```

**Dependencies**

Step 1 complete.

**Exit Criteria**

```text
Infrastructure boots without error
service_role key is never referenced in client-reachable code
No business logic present
```

---

# STEP 3

## Authentication

**Objective**

Implement the Authentication Service exactly as defined in `docs/authentication-architecture.md`.

**Deliverables**

```text
Supabase client wrapper for auth (sign-up/sign-in/sign-out/
  session refresh)
Session resolver (validates the Supabase session,
  resolves identity.current_user_id())
Role resolver (identity.is_admin(), identity.user_roles)
Auth middleware entry point (per the Thin Controller
  principle -- authentication is a controller
  responsibility, never business logic)
```

**Dependencies**

Steps 1-2 complete; `docs/authentication-architecture.md` approved; `identity.is_admin()` / `identity.current_user_id()` (already implemented, migration 001).

**Exit Criteria**

```text
Login/logout/session validation functional
Role resolution matches identity.user_roles live, not a
  cached or token-derived value
service_role never exposed client-side
RLS remains the final authorization boundary --
  application-layer checks are confirmed advisory only
```

---

# STEP 4

## Identity

**Objective**

Implement Identity Domain services: user profiles, creator profiles, community membership, account lifecycle, per `docs/domain-architecture.md`'s Identity Domain.

**Deliverables**

```text
Identity Service consuming the profile fields of
  api.creator_dashboard_view and api.member_dashboard_view
```

**Dependencies**

Step 3 (Authentication) complete; `docs/identity-schema.md`.

**Exit Criteria**

```text
Profile read/update flows work through the api schema only
No direct identity.* table access from application code
```

---

# STEP 5

## Governance

**Objective**

Implement Governance Domain services: feature flag checks, system settings, governance rules, AI control consumption, per `docs/domain-architecture.md`'s Governance Domain.

**Deliverables**

```text
Governance Service wrapping api.is_feature_enabled() and
  api.platform_configuration_view
```

**Dependencies**

Steps 1-4; `docs/governance-schema.md`; seed data (migration 009) already populated.

**Exit Criteria**

```text
Feature flag checks resolve correctly and live (no caching
  that could diverge from governance.feature_flags)
api.platform_configuration_view remains administrator-only
  in practice, matching its existing admin-gated design
```

---

# STEP 6

## Campaigns

**Objective**

Implement Campaign Domain services: creation, scheduling, distribution, rotation, closing, archiving, restoring, per `docs/backend-architecture.md`'s Campaign Service and `docs/domain-architecture.md`'s Campaign Domain.

**Deliverables**

```text
Campaign Service wrapping api.campaign_summary_view,
  api.distribute_campaign(), api.rotate_campaign(),
  api.close_campaign(), api.archive_campaign(),
  api.restore_campaign(), api.calculate_campaign_performance()
```

**Dependencies**

Steps 1-5; `docs/economy-schema.md`, `docs/discovery-schema.md`, `docs/protection-schema.md`.

**Exit Criteria**

```text
Full campaign lifecycle operable end-to-end through the
  api schema only
Cooldown enforcement (centralized inside
  api.distribute_campaign(), per the Migration 008 review)
  is respected -- no application-layer workaround or
  duplicate check
```

---

# STEP 7

## Discovery

**Objective**

Implement Discovery Domain services: discovery opportunity and assignment visibility, distribution analytics, per `docs/domain-architecture.md`'s Discovery Domain.

**Deliverables**

```text
Discovery Service wrapping api.discovery_summary_view
```

**Dependencies**

Step 6 (Campaign Domain produces discovery opportunities via `api.distribute_campaign()`).

**Exit Criteria**

```text
Discovery data readable per its existing RLS scoping
  (creator/admin only, per docs/discovery-schema.md) --
  no attempt to expose it more broadly at the
  application layer
```

---

# STEP 8

## Protection

**Objective**

Implement Protection Domain services: a creator's own exclusion visibility, per `docs/domain-architecture.md`'s Protection Domain.

**Deliverables**

```text
Protection Service wrapping api.creator_protection_view
```

**Dependencies**

Steps 6-7.

**Exit Criteria**

```text
A creator sees only their own exclusion status (community,
  exclusion status, reason, expiration)
Cooldown status is NOT exposed to creators -- ADR-013
  remains open and is not worked around at this layer
```

---

# STEP 9

## Intelligence

**Objective**

Implement Intelligence Domain services: reputation, badges, achievements, bonus orchestration, per `docs/domain-architecture.md`'s Intelligence Domain.

**Deliverables**

```text
Intelligence Service wrapping api.badges_view,
  api.award_badge(), api.revoke_badge(),
  api.calculate_member_reputation(),
  api.calculate_creator_reputation(),
  api.calculate_community_reputation(),
  api.reputation_leaderboard_view,
  api.create_performance_bonus() (shared with Payment Domain)
```

**Dependencies**

Steps 1-8.

**Exit Criteria**

```text
Badge award/revoke flows functional and admin-gated
Reputation scores are clearly labeled provisional in any
  user-facing surface -- ADR-015 remains open
Leaderboard remains admin-only in practice -- ADR-014
  remains open and is not worked around
```

---

# STEP 10

## Analytics

**Objective**

Implement Analytics Domain services: dashboards, reporting, aggregated metrics, per `docs/domain-architecture.md`'s Analytics Domain.

**Deliverables**

```text
Analytics Service wrapping api.platform_statistics_view
  (administrator-only) and api.community_dashboard_view
```

**Dependencies**

Steps 1-9 (aggregates data produced by most other domains).

**Exit Criteria**

```text
Platform statistics remain correctly gated to administrators
Community dashboard correctly renders NULL/empty states for
  RLS-restricted fields (active_campaigns_count,
  historical_performance) rather than a workaround
```

---

# STEP 11

## Notifications

**Objective**

Implement the Notification Service: email and in-app notifications, future push, per `docs/backend-architecture.md`'s Notification Service.

**Deliverables**

```text
Notification Service scaffolding and provider integration
  (email provider, per External Integrations)
Event-driven triggers consuming analytics.analytics_events
```

**Dependencies**

Steps 6-10 (notifications are triggered by campaign, discovery, and bonus events per the Event Flow).

**Exit Criteria**

```text
Notification dispatch functional for at least one event type
No business rule is duplicated from the database layer --
  notification content is derived from already-computed
  data, not reimplemented logic
```

---

# STEP 12

## Payments

**Objective**

Implement Payment Domain services: Flutterwave integration, payment verification, wallet operations, bonus payouts, per `docs/domain-architecture.md`'s Payment Domain.

**Deliverables**

```text
Payment Service wrapping api.wallet_summary_view,
  api.calculate_wallet_balance()
Flutterwave integration for credit purchase
```

**Dependencies**

Steps 1-11; `docs/economy-schema.md`. If Flutterwave-driven wallet crediting requires a new `api.*` procedure not yet built, that is an Architecture Change Lifecycle proposal, not an application-layer workaround.

**Exit Criteria**

```text
Wallet balance always reflects economy.credit_wallets via
  the api schema
No direct write to economy.credit_wallets or
  economy.credit_transactions from application code
```

---

# STEP 13

## Frontend Integration

**Objective**

Connect the Admin, Creator, and Community dashboards plus the Analytics Dashboard to the backend and api schema, per `docs/implementation-playbook.md`'s Frontend Rules.

**Deliverables**

```text
Admin, Creator, Community, and Analytics dashboards, each
  consuming their documented api.*_dashboard_view /
  api.*_summary_view objects
```

**Dependencies**

Steps 1-12.

**Exit Criteria**

```text
Every dashboard reads exclusively from the api schema
RLS-driven NULL/empty states are handled gracefully, not
  patched over with a direct table query or a hardcoded
  fallback value
```

---

# STEP 14

## Testing

**Objective**

Validate the full stack per `docs/phase-4-kickoff.md`'s Testing scope and `docs/implementation-playbook.md`'s Definition of Done.

**Deliverables**

```text
Unit, integration, security, performance, and user
  acceptance test suites covering every domain service
Security tests confirming RLS cannot be bypassed and that
  PUBLIC execute remains revoked on every api schema
  function and procedure (per the Migration 008 Security
  Review)
```

**Dependencies**

Steps 1-13.

**Exit Criteria**

```text
docs/implementation-playbook.md's Definition of Done is
  satisfied for every component
No regression against any finding from the Migration 008
  Views / Functions / Procedures / Security reviews
```

---

# STEP 15

## Deployment

**Objective**

Prepare and execute production deployment, per `docs/backend-architecture.md`'s Observability and External Integrations sections.

**Deliverables**

```text
Deployment pipeline
Monitoring and observability wiring (structured logs,
  audit records, metrics, tracing identifiers)
```

**Dependencies**

Steps 1-14 complete and reviewed.

**Exit Criteria**

```text
Production environment operational
service_role key confirmed absent from every client-shipped
  artifact
Rollback plan documented
```

---

# Step Completion Log

```text
Step 1 -- Repository Scaffold
  Status: COMPLETE
  Reviewed: Architecture compliance review passed

Step 2 -- Core Infrastructure
  Status: COMPLETE
  Reviewed: typecheck + build passed, service_role/business-logic
    scan passed

Step 3 -- Authentication
  Status: COMPLETE -- Founder approved, 2026-07-15
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed
  Technical debt logged: docs/technical-debt.md TD-001 (direct
    identity.* RPC calls in app/auth/ to migrate to api.* wrapper
    functions once the API layer is finalized)

Step 4 -- Identity Profile Read Infrastructure
  Status: COMPLETE -- Founder approved, 2026-07-15
  Scope implemented: read-only profile access via
    api.creator_dashboard_view / api.member_dashboard_view
    (app/domains/identity/, app/services/identity/). Profile *update*
    is not yet implemented -- no api schema write mechanism for
    identity.users profile fields exists in the locked migrations; this
    label reflects implemented scope accurately rather than the
    roadmap's original "Identity" step name.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 5 -- Governance
  Status: COMPLETE -- Founder approved, 2026-07-15
  Scope implemented: api.is_feature_enabled() wrapper (live, uncached)
    and api.platform_configuration_view read
    (app/domains/governance/, app/services/governance/)
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 6 -- Campaigns
  Status: COMPLETE -- Founder approved, 2026-07-15
  Scope implemented: full campaign lifecycle wrapper --
    api.campaign_summary_view (get/list), api.distribute_campaign(),
    api.rotate_campaign(), api.close_campaign(), api.archive_campaign(),
    api.restore_campaign(), api.calculate_campaign_performance()
    (app/domains/campaign/, app/services/campaign/). Cooldown
    enforcement not duplicated -- remains centralized in
    api.distribute_campaign() only.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 7 -- Discovery
  Status: COMPLETE -- Founder approved, 2026-07-15
  Scope implemented: api.discovery_summary_view read (get/list)
    (app/domains/discovery/, app/services/discovery/). No distribution
    logic -- Discovery Domain reads and reports only; distribution
    remains owned by Campaign Domain's api.distribute_campaign().
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 8 -- Protection
  Status: COMPLETE -- Founder approved, 2026-07-15
  Scope implemented: api.creator_protection_view read (own exclusions
    only) (app/domains/protection/, app/services/protection/).
    Deliberately does not wrap api.is_creator_on_cooldown() -- cooldown
    status is not exposed to creators; ADR-013 remains open and is not
    worked around at this layer.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 9 -- Intelligence
  Status: COMPLETE -- Founder approved, 2026-07-15
  Scope implemented: api.badges_view (read), api.award_badge(),
    api.revoke_badge(), api.calculate_member_reputation(),
    api.calculate_creator_reputation(),
    api.calculate_community_reputation(),
    api.reputation_leaderboard_view (read), api.create_performance_bonus()
    (app/domains/intelligence/, app/services/intelligence/;
    createPerformanceBonus() to be reused, not re-wrapped, by Step 12
    Payment Domain).
  ADR compliance: reputation scores carry `isProvisional: true` on the
    type itself (ADR-015 open); leaderboard reads are a bare passthrough
    with no widening beyond existing RLS, which limits non-admins to at
    most their own row (ADR-014 open, not worked around); no cooldown
    fields or checks present (ADR-013 unaffected by this step).
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 10 -- Analytics
  Status: COMPLETE -- Founder approved, 2026-07-16
  Scope implemented: api.platform_statistics_view (administrator-only
    read) and api.community_dashboard_view (get/list)
    (app/domains/analytics/, app/services/analytics/). RLS-restricted
    fields (active_campaigns_count, historical_performance) are passed
    through as-is (0 / null for non-owning non-admins) -- no workaround
    added to backfill them.
  ADR compliance: no cooldown, leaderboard, or reputation-finality
    references present -- ADR-013/014/015 unaffected by this step.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 11 -- Notifications
  Status: COMPLETE -- Founder approved, 2026-07-16
  Scope implemented: notification domain model + application service
    (pure event-to-content mapping, DISCOVERY_ASSIGNED covered),
    email provider scaffolding (unconfigured stub -- vendor is a
    Future External Integration, not yet approved), and the
    event-consuming background job (app/domains/notification/,
    app/services/notification/, app/notifications/, app/jobs/).
  Documented exception: notification-dispatch-job.ts reads
    analytics.analytics_events directly via service_role (no api.*
    view exists for it; analytics_events_admin_select RLS is
    admin-only; background jobs have no per-request session --
    the established trusted-automation use of service_role). Confined
    to that one file, never client-reachable. Logged as
    docs/technical-debt.md TD-002.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 12 -- Payments
  Status: COMPLETE (read/orchestration scope) -- Founder approved,
    2026-07-16
  Scope implemented: api.wallet_summary_view (read),
    api.calculate_wallet_balance() (read), api.create_performance_bonus()
    re-exported from Step 9's Intelligence Service, not re-wrapped
    (app/domains/payment/, app/services/payment/).
  Deliberately deferred: Flutterwave integration for credit purchase.
    No api.* procedure exists to credit economy.credit_wallets from a
    verified purchase (only api.create_performance_bonus() credits
    wallets, and only for bonus allocations; docs/domain-architecture.md's
    Payment Domain "Uses" list does not name one either). Per this
    step's own Dependencies clause, adding one is an Architecture
    Change Lifecycle proposal, not an application-layer workaround --
    not invented here. No Flutterwave code (not even a verification
    stub) was written this step. Tracked as ADR-017 -- Payment Credit
    Pipeline (docs/architecture-decisions.md, "Pending ADR Proposals").
    Requested as "ADR-016," but that number is already assigned (AI
    Service Is a Separate Python/FastAPI Application); renumbered to
    avoid a collision.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed

Step 13 -- Frontend Integration
  Status: COMPLETE -- Founder approved, 2026-07-16
  docs/frontend-architecture.md created, refined (Navigation
    Strategy replacing a fixed nav layout; Dashboard Data Flow
    section added: Page -> Domain Service -> API Schema -> Business
    Schema -> RLS), and LOCKED by Founder approval before dashboard
    implementation resumed, per the project's "documentation before
    implementation" discipline.
  Dashboard pages moved under the app/(dashboards)/ route group and
    wired to a new shared Dashboard Layout (app/(dashboards)/layout.tsx)
    implementing the Navigation Strategy principles: static,
    role-agnostic links to /admin, /creator, /community, /analytics,
    structural chrome only -- no data-fetching, no session
    resolution, no authorization decision of its own.
  Scope implemented: Admin (api.platform_configuration_view via Step
    5 Governance Service), Creator (full api.creator_dashboard_view
    via the page-local reader app/(dashboards)/creator/data.ts --
    documented exception, cross-domain view with no single owner),
    Community (api.community_dashboard_view via Step 10 Analytics
    Service), Analytics (api.platform_statistics_view via Step 10
    Analytics Service). Every page follows the Dashboard Data Flow
    pipeline without skipping a stage.
  Reviewed: typecheck + build passed (after clearing a stale .next
    route-type cache from the file move), Architecture Compliance
    Review passed, Security Review passed.

Step 14 -- Testing
  Status: COMPLETE, 2026-07-16
  Jest test suite added (jest.config.js, via next/jest): 13 suites,
    34 tests, all passing. Unit/mocked-integration coverage for every
    domain service (auth, identity, governance, campaign, discovery,
    protection, intelligence, analytics, payment, notification) plus
    the notification dispatch job. One static security test verifies
    008_create_api_schema.sql's PUBLIC-execute REVOKE precedes the
    authenticated/service_role GRANT.
  Honest scope limitations (no live Supabase/Postgres project in this
    environment): mocked-client integration, not live-database
    integration; a live pg_proc/RLS verification script provided
    (tests/security/live-verification-queries.sql) but not executed;
    performance testing deferred entirely (no environment to
    benchmark against); user acceptance testing captured as a manual
    checklist (tests/uat-checklist.md) for a human reviewer, not
    automated. See tests/README.md for the full breakdown.
  Reviewed: typecheck + build passed, Architecture Compliance Review
    passed, Security Review passed.

Step 15 -- Deployment (Preparation)
  Status: COMPLETE (preparation scope), 2026-07-16
  Implemented: CI pipeline (.github/workflows/ci.yml -- typecheck,
    test, build on push/PR to main); observability wiring
    (app/utils/audit.ts, metrics.ts, tracing.ts -- structured,
    vendor-neutral, swappable behind their own function signatures,
    since Monitoring platform remains a Future External Integration
    and `audit` remains a Future schema per CLAUDE.md); rollback plan
    and recommended deployment target documented
    (backend/docs/deployment.md).
  Exit criterion "service_role key confirmed absent from every
    client-shipped artifact" -- verified by actually grepping the
    built .next/static output after npm run build, not assumed: zero
    matches for service_role / SUPABASE_SERVICE_ROLE_KEY.
  Deliberately NOT executed: standing up a live production
    environment. No live hosting account, Supabase project, or
    deployment credential exists in this environment/session, and
    doing so is a hard-to-reverse action affecting a real, shared
    system -- requiring the Founder's explicit, informed
    authorization to actually provision, not autonomous execution.
    Everything above is ready the moment real infrastructure exists.
  Reviewed: typecheck + build + test suite passed, Architecture
    Compliance Review passed, Security Review passed.
```

---

# Roadmap Status

```text
Document:
docs/phase-5-roadmap.md

Phase:
Phase 5 — Application Implementation

Hierarchy Level:
2

Steps defined:
15 / 15, each with Objective, Deliverables, Dependencies,
and Exit Criteria

Steps completed:
15 / 15 (Step 15 completed at preparation scope -- see its entry
above for what remains deliberately unexecuted and why)

Status:
COMPLETE -- Phase 5 implementation finished, 2026-07-16

Ready for:
docs/phase-5-completion.md (Implementation Summary, Technical Debt
Summary, ADR Status Summary, Architecture Compliance Report,
Security Validation Report), then Founder approval before the next
phase
```
