# PCGH Community Engine

# Phase 6 Charter

---

# Phase

**Phase 6 — API Foundation & Application Layer**

---

# Status

🚧 IN PROGRESS

---

# Date

2026-07-17

---

# Executive Summary

Phase 5 is frozen as a permanent architectural baseline — `docs/phase-5-completion.md`, v0.5.0, commit `4bbba74`. Every domain service, dashboard, and the supporting infrastructure (auth, observability, testing, CI) it defined is locked and is not reopened by this phase except through the same Architecture Change Lifecycle that governs everything else.

Phase 6 begins the next layer on top of that baseline: a callable HTTP API exposing the existing domain services to external callers (a future first-party client, scripts, eventually a mobile app), governed by `docs/api-specification.md` and by the new permanent governance register, `docs/engineering-principles.md`, established at the Phase 5/6 boundary specifically so this phase would not have to re-derive engineering discipline from conversational precedent.

---

# Phase 6 Mission

Expose the frozen Phase 5 platform through a versioned, thin-controller HTTP API without reopening, redesigning, or duplicating anything Phase 5 already locked.

Architecture always precedes implementation, per `docs/engineering-principles.md` AGR-001 — restated here, not re-derived, because it is now a permanent rule with its own citable identifier rather than a project convention living only in this charter.

---

# Work Package Numbering (EWP)

Phase 6 implementation work is tracked as numbered **Engineering Work Packages (EWP-NNN)**, introduced with this phase. Each EWP:

```text
Gets its own architecture document (or a section of one) before
  implementation begins, per AGR-001 -- never implemented first and
  documented after.

Is scoped narrowly enough to review as a unit -- "API Foundation,"
  not "the entire API."

Is recorded in this charter's Deliverables/Success Criteria once
  defined, and in the relevant architecture document's own header
  (e.g. docs/api-specification.md cites "EWP-001").
```

`EWP-001 — API Foundation & Application Layer` is the first, covering `docs/api-specification.md` (routing, versioning, authentication/observability integration, response contract, validation, middleware conventions) and the v1 endpoint implementation that conforms to it. Later work packages (EWP-002 and onward) are not pre-defined by this charter — they are added as Phase 6 actually needs them, not speculated here.

---

# Phase 6 Principles

Restated by reference, not re-derived — every principle below now has a permanent identifier in `docs/engineering-principles.md`, and future work should cite the identifier directly rather than this charter's paraphrase of it.

## Architecture First

No implementation may introduce new architecture without the Proposal → Architecture Review → ADR → Documentation Update → Implementation sequence.

**Governing rule:** AGR-001, AGR-002.

## API Schema First

Application code — including every new API route handler — interacts with the database exclusively through the `api` schema, through exactly one domain service call per controller. Direct business-schema access remains permitted only as the two already-documented, bounded exceptions (TD-001, TD-002); no new exception may be added without the same rigor those two received.

**Governing rule:** AGR-004.

## RLS Remains Final

Row Level Security is the actual authorization boundary. Nothing built in Phase 6 — including any per-route authorization check — substitutes for it.

**Governing rule:** AGR-005.

## Thin Controller, Thin Service

A route handler authenticates, validates, calls exactly one service, and formats the response. Business logic lives in `app/services/`, never in `app/api/`.

**Governing rule:** EPR-001, and Section 1 of `docs/api-specification.md`.

## No Unapproved Vendor or Framework Decisions

A schema-validation library, a rate-limiting service, or any other new dependency is an Architecture Change Lifecycle proposal, not a default reached for mid-implementation.

**Governing rule:** EPR-006; `docs/api-specification.md` Sections 6 and 10.

## Verify, Don't Assume

Every EWP's completion is established by actually running lint/typecheck/test/build in the session doing the work — never asserted from a prior turn or a tool summary.

**Governing rule:** QGR-003.

## Integration Tests Are Not Deferred

Every new API route ships, within the same work package that introduces it, with unit tests for any new logic, an integration test under `backend/tests/integration/api/` exercising the complete HTTP request lifecycle, and any documentation update the route required — never deferred to a later testing pass, unlike Phase 5's own Step 14 (Testing) arriving after Steps 1-13's implementation.

**Governing rule:** QGR-006.

---

# Scope

Phase 6 includes:

## API Foundation (EWP-001)

- `docs/api-specification.md` — routing, versioning, authentication/observability integration, response contract, validation, middleware conventions (drafted; pending approval as of this charter)
- v1 endpoints for the domains already implemented in Phase 5 (Campaign, Discovery, Protection, Intelligence, Analytics, Governance, Payment, Notification), conforming exactly to the approved specification
- Pagination support added to Phase 5's `list*` service functions — a dependency `api-specification.md` Section 7 explicitly flagged as necessary follow-up work, not solved by the architecture document itself

## Future Work Packages

Not yet defined. Added to this charter as EWP-002 onward only once actually scoped — this charter does not speculate on Phase 6's full extent in advance.

---

# Out of Scope

The following remain outside Phase 6 unless explicitly pulled in by a future decision:

```text
Resolving ADR-013, ADR-014, ADR-015, or ADR-017 -- these stay on
  their own track; no Phase 6 endpoint may expose or assume any of
  their outcomes (AGR-006)

Redesigning any Phase 5 domain service, domain model, or dashboard --
  Phase 5 is frozen; Phase 6 calls it, does not reopen it

Adopting a schema-validation library or a rate-limiting solution --
  explicitly deferred pending their own proposals
  (api-specification.md Sections 6, 10)

Live production deployment -- Phase 5 Step 15 already established
  that no hosting credentials/environment exist in this
  development context; provisioning one is not automatically part
  of Phase 6 unless separately directed
```

---

# Open Architecture Decisions

Unchanged from Phase 5's freeze. Titles match `docs/architecture-decisions.md` exactly:

```text
ADR-013 -- Creator Protection Visibility
ADR-014 -- Public Reputation Leaderboards
ADR-015 -- Reputation & Trust Scoring Model
ADR-017 -- Payment Credit Pipeline
```

No Phase 6 implementation may assume an outcome for any of these before they are formally approved (AGR-006).

---

# Success Criteria

Phase 6 (EWP-001) will be considered complete when:

```text
docs/api-specification.md is reviewed and marked Approved/LOCKED
v1 endpoints are implemented conforming exactly to that specification
Pagination is implemented in every list* service the API layer exposes
npm run lint, npm run typecheck, npm test, and npm run build all pass
Every endpoint has an Architecture Compliance Review and a
  Security Review, per QGR-002
Every endpoint has a unit test for any new logic and an integration
  test under backend/tests/integration/api/, delivered in the same
  work package as the endpoint itself, per QGR-006 -- not deferred
Any deviation from the approved specification is preceded by a
  specification update, never followed by one, per the Founder's
  standing instruction on api-specification.md's canonical status
```

---

# Deliverables

```text
docs/api-specification.md (Approved/LOCKED)
Versioned API route handlers under backend/app/api/v1/
Pagination support in the affected Phase 5 domain services
Updated test suite covering the new route handlers
Updated documentation-governance-framework.md / phase-6-charter.md
  status as EWP-001 progresses
```

---

# Engineering Philosophy

Restated from Phase 4's charter, unchanged, because it remains true:

Every implementation should prioritize maintainability, security, scalability, extensibility, observability, documentation, and governance. Implementation speed must never compromise architectural quality.

The operating model established at the Phase 5/6 boundary applies throughout: the Founder sets vision and approves direction; the Chief Architect reviews architecture, governance, and long-term technical consistency; Claude implements, verifies, and maintains the repository against `docs/engineering-principles.md`'s documented standards — not against conversational memory.

---

# Phase Status

```text
Phase 1 — Platform Architecture
████████████████████ 100% ✅ COMPLETE

Phase 2 — Physical Database Design
████████████████████ 100% ✅ COMPLETE

Phase 3 — Database Implementation
████████████████████ 100% ✅ COMPLETE

Phase 4 — Application Architecture
████████████████████ 100% ✅ COMPLETE

Phase 5 — Application Implementation
████████████████████ 100% 🔒 FROZEN (v0.5.0)

Phase 6 — API Foundation & Application Layer
██████████████░░░░░░  70% 🚧 IN PROGRESS
  (docs/api-specification.md APPROVED/LOCKED; EWP-001 shared
  foundation delivered 2026-07-17; EWP-002 Campaign API
  FOUNDER/CHIEF ARCHITECT APPROVED AND FROZEN, 2026-07-18 -- 8
  routes (list/get/performance/distribute/rotate/close/archive/
  restore), the first domain work package, built on the EWP-001
  foundation with zero changes to campaign-service.ts. TD-005
  (error classification) RESOLVED via an audit-first, shared,
  domain-agnostic mechanism -- see EWP Approval Log below. TD-006
  (silent no-op in close/archive/restore) logged as legitimate open
  debt, explicitly not fixed opportunistically. 29 suites / 99
  tests passing, lint/typecheck/build all clean. Discovery,
  Protection, Intelligence, Analytics, Governance, Payments, and
  Notifications domains remain unimplemented)
```

---

# EWP Approval Log

```text
EWP-001 -- API Foundation & Application Layer (shared foundation)
  Delivered: 2026-07-17
  Scope: app/api/_lib/{response,errors,validation,handler}.ts,
    the public app/api/v1/health route
  Status: Delivered; approval implicit in EWP-002 proceeding on top
    of it -- no separate freeze record was requested at the time

EWP-002 -- Campaign API
  Delivered: 2026-07-18
  Scope: 8 Campaign routes (Section 2 of api-specification.md),
    zero changes to campaign-service.ts
  Founder / Chief Architect Decision: APPROVED FOR FREEZE, 2026-07-18
  Conditions attached at provisional acceptance: TD-005 resolved
    through a narrow architecture review (audit-first, shared
    mechanism, documentation before implementation) -- satisfied,
    see docs/technical-debt.md TD-005 (RESOLVED) and
    docs/api-specification.md Section 7 ("Error Classification")
  TD-006 opened during the same hardening pass, explicitly NOT
    fixed opportunistically -- remains legitimate open debt,
    scheduled only through the Architecture Change Lifecycle
  Status: 🔒 FROZEN
```

---

# Next Step

Propose EWP-003's exact scope (not implement it) before any further work begins, per the Founder/Chief Architect's explicit hold. EWP-003 must ship its own tests (unit + `tests/integration/api/`) and synchronized documentation within the same work package, per QGR-006 -- not deferred, matching EWP-002's own discipline. EWP-003 must not expand architecture and must not resolve TD-006 as a side effect of its own scope, even opportunistically.

---

# Phase 6 Success Mantra

Design
      ↓
Governance
      ↓
Security
      ↓
Architecture
      ↓
Implementation
      ↓
Quality

---

# Document Status

**Status:** ACTIVE

**Classification:** Level 2 — Architecture

**Owner:** Founder / Chief Architect

**Last Updated:** 2026-07-17
