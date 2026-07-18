# PCGH Community Engine

# Phase 6 Charter

---

# Phase

**Phase 6 — API Foundation & Application Layer**

---

# Status

🔒 FROZEN — v0.6.0 (Founder/Chief Architect Final Acceptance, 2026-07-18; see `docs/phase-6-completion.md` for the full Freeze Record)

---

# Date

2026-07-17 (original draft); frozen 2026-07-18

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
████████████████████ 100% 🔒 FROZEN — v0.6.0
  (docs/api-specification.md APPROVED/LOCKED; EWP-001 through
  EWP-007 all Founder/Chief Architect APPROVED AND FROZEN,
  2026-07-18 -- 17 routes across Campaign (8), Discovery (2),
  Protection (1), Analytics (3), Intelligence Badge Catalog (1),
  and Identity Profile (1), plus the public health route. Phase 6
  API Foundation Coverage Review completed and accepted, 2026-07-18,
  with a formal Deferred Capability Register (below) covering
  Governance, Payment, Notification, Protection cooldown, and the
  remaining Intelligence capabilities. Phase 6 Chief Architect Final
  Acceptance Audit: 10/10, zero Major/Critical findings, Founder-
  approved 2026-07-18. Full detail in `docs/phase-6-completion.md`
  and the EWP Approval Log below -- not re-narrated here)
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

EWP-003 -- Discovery API
  Delivered: 2026-07-18
  Scope: 2 Discovery routes (GET /api/v1/discovery,
    GET /api/v1/discovery/{opportunityId}, Section 2 of
    api-specification.md), zero changes to discovery-service.ts,
    zero new app/api/_lib/ code
  Founder / Chief Architect scope approval: 2026-07-18, with two
    clarifications incorporated before implementation -- pagination
    handled exclusively via the existing parsePaginationParams()/
    paginate() mechanism (no new pagination validation), and
    opportunityId treated as an opaque path string per the verified
    EWP-002 convention (no new UUID-validation contract introduced)
  TD-006 out of scope -- structurally unreachable from this EWP,
    since Discovery Domain has no mutating service function at all
  Founder / Chief Architect Decision: APPROVED FOR FREEZE, 2026-07-18
  Status: 🔒 FROZEN

EWP-004 -- Protection API
  Delivered: 2026-07-18
  Scope: 1 Protection route (GET /api/v1/protection/exclusions,
    Section 2 of api-specification.md), zero changes to
    protection-service.ts, zero new app/api/_lib/ code
  Founder / Chief Architect scope approval: 2026-07-18 -- exact
    minimum surface (list only, no [id] route, no mutation route),
    self-only RLS behavior preserved exactly (no admin bypass
    introduced), ADR-013 not decided/weakened/bypassed (no cooldown
    field exposed, verified by an explicit integration-test
    assertion)
  TD-001/TD-002/TD-006 and all open ADRs untouched
  Founder / Chief Architect Decision: APPROVED FOR FREEZE, 2026-07-18
  Status: 🔒 FROZEN

EWP-005 -- Analytics API
  Delivered: 2026-07-18
  Scope: 3 Analytics routes (GET /api/v1/analytics/platform,
    GET /api/v1/analytics/communities,
    GET /api/v1/analytics/communities/{communityId}, Section 2 of
    api-specification.md), zero changes to analytics-service.ts,
    zero new app/api/_lib/ code, zero mutations (Analytics Service
    exports none)
  Founder / Chief Architect scope approval: 2026-07-18 -- Analytics
    selected over Intelligence (ADR-014/015 entanglement, larger
    mutation surface), Payment (userId-parameter design ambiguity,
    ADR-017-adjacent), Notification (no readable capability exists
    -- would require inventing one), and Governance (one function,
    isFeatureEnabled, exists without a demonstrated public-exposure
    justification) -- per the standing discipline that service
    capability existence does not by itself justify public API
    exposure
  /platform's 404-on-null documented as an intentional
    non-disclosure semantic (never distinguishing "no data" from
    "unauthorized"), per the Founder's explicit instruction
  RLS correction during implementation: the EWP-005 proposal had
    mis-cited community_analytics_select_creator as governing
    community_dashboard_view's row-level visibility. Traced against
    migration SQL directly during implementation and corrected:
    row-level visibility is member_communities_select_own (admin OR
    community membership); reputation/activity/consistency/trust
    scores and historical_performance are admin-only
    (community_reputation_admin_manage,
    community_performance_history_admin_select); only
    participation_rate/discoveries_* are creator-gated
    (community_analytics_select_creator). No code change required
    -- the route is an unmodified passthrough and RLS was already
    correct; only the EWP-005 proposal's citation was wrong. See
    api-specification.md Section 2 for the corrected, source-cited
    description
  ADR-008 (Analytics Is a Rollup Layer, Not a Source of Truth,
    closed) preserved -- zero recomputation, pure passthrough
  TD-001/TD-002/TD-006 and all open ADRs (013/014/015/017) untouched
  Founder / Chief Architect Decision: APPROVED FOR FREEZE, 2026-07-18
    -- RLS-citation correction explicitly accepted as a
    documentation/analysis correction, not an implementation defect
    (QGR-003 applied correctly: the migration chain was inspected
    before permanent documentation was finalized, and the earlier
    assumption was corrected without altering correct implementation
    merely to conform to it)
  Status: 🔒 FROZEN
```

```text
EWP-006 -- Intelligence Badge Catalog API
  Delivered: 2026-07-18
  Scope: 1 route (GET /api/v1/intelligence/badges, Section 2 of
    api-specification.md), zero changes to intelligence-service.ts,
    zero new app/api/_lib/ code. Deliberately named and scoped as
    the Badge Catalog only, not "the Intelligence API"
  Founder / Chief Architect scope approval: 2026-07-18 -- exact
    minimum surface (listBadges only); getReputationLeaderboard(),
    awardBadge(), revokeBadge(), the reputation recalculation
    functions, and createPerformanceBonus() explicitly NOT exposed
    and not implied approved for exposure by this EWP
  ADR-014/ADR-015 verified unaffected: intelligence.badges RLS
    (badges_select_all: using (true), migration 005) and columns
    have no relationship to reputation scoring or leaderboard
    ranking, confirmed by direct inspection, not assumed
  Payment, Governance, and Notification domains untouched by this
    EWP
  Founder / Chief Architect Decision: APPROVED FOR FREEZE, 2026-07-18
    -- narrow naming and scope explicitly confirmed as correct; this
    approval does not extend to the broader Intelligence Domain
  Status: 🔒 FROZEN
```

```text
EWP-007 -- Identity Profile API
  Delivered: 2026-07-18
  Scope: 1 route (GET /api/v1/identity/profile, Section 2 of
    api-specification.md), zero new app/api/_lib/ code
  Founder / Chief Architect scope approval: 2026-07-18 -- one
    unified self-profile endpoint, no [userId] route, identity
    derived from the authenticated session (never caller-supplied),
    no pagination, no profile mutation
  Architectural gap found and stopped-on during implementation:
    neither getCreatorProfile() nor getMemberProfile() is a
    role-accurate name for an arbitrary authenticated caller
    (identity.user_roles.role_name is independently assignable
    across member/creator/admin, migration 001) -- surfaced to the
    Founder/Chief Architect rather than silently picking one or
    inventing a fix. Resolved by a separately-approved, narrowly
    scoped addition: getUserProfile(), a role-neutral third read
    added to profile-service.ts (Founder/Chief Architect approved
    2026-07-18) -- additive only, getCreatorProfile()/
    getMemberProfile() unchanged, no new migration/view/RLS. A
    scoped exception to Phase 5's freeze, per the Architecture
    Change Lifecycle, not a silent reopening
  Identity Domain was not in the charter's original Scope list --
    ruled IN SCOPE by Founder/Chief Architect decision, 2026-07-18,
    per the Phase 6 API Foundation Coverage Review (drafting
    oversight, not an intentional exclusion)
  No profile-update capability added; ADR-013/014/015/017 and
    TD-001/TD-002/TD-006 unrelated, untouched
  Founder / Chief Architect Decision: APPROVED FOR FREEZE, 2026-07-18
    -- getUserProfile() confirmed the correct minimal role-neutral
    solution; stop-and-report process confirmed correctly followed
    before modifying the frozen Phase 5 service; change confirmed
    additive and within approved architecture
  Status: 🔒 FROZEN
```

---

# Deferred Capability Register

Established 2026-07-18, per the Phase 6 API Foundation Coverage Review and the Founder/Chief Architect's decision to accept it. This register is the authoritative record of every existing service capability deliberately **not** exposed through the Phase 6 API as of EWP-006, organized by why each is withheld -- so that future work consults this table before re-litigating a decision already made, and so that "not yet exposed" is never mistaken for "forgotten." Distinct from `docs/technical-debt.md`, which tracks implementation shortcuts, not scope decisions.

## Intentionally Deferred (capability exists, exposure would be safe in isolation, but no genuine need is demonstrated yet, or a dedicated review is warranted before proceeding)

```text
Governance -- getPlatformConfiguration()
  Mirrors Analytics' proven admin-gated-null pattern exactly, but
  returns raw system_settings values (operational tuning knobs) --
  a more sensitive payload shape than anything exposed so far, with
  no stated Phase 6 client requirement.
  Condition: a genuine admin-tooling or client requirement is
  stated; payload re-reviewed for field-level sensitivity first.

Intelligence -- awardBadge(), revokeBadge()
  Admin mutation surface (recognition system), no demonstrated
  external client need yet.
  Condition: a concrete admin-tooling requirement emerges; reviewed
  on its own, not bundled with reads.

Payment -- getWalletSummary(), getWalletBalance()
  First domain touching real financial data; both functions take an
  explicit userId parameter rather than being purely session-scoped
  -- the first domain requiring a new authorization-parameter
  decision (session-derived-only vs. path param), not yet made.
  Condition: a dedicated architecture decision on the session-
  derived-identity pattern for financial reads (extending the
  precedent already set by rotateCampaign's createdBy), reviewed on
  its own before any Payment route is built.
```

## Internal-Only (capability is not, or should not become, a public API surface under current architecture)

```text
Governance -- isFeatureEnabled(flagName)
  The service's own comment frames it as the backend's single
  internal owner of flag-checks, consumed by other domains (e.g. AI
  Domain) -- not a client-facing capability. No admin gate exists at
  all, and no established API resource shape covers a global/keyed
  lookup with no per-user ownership.
  Condition: a concrete external client use case is stated AND a
  resource-shape decision is made (e.g. single-key lookup vs. bulk
  list) -- a real design choice, not a given, before this could even
  be proposed.

Protection -- cooldown status (api.is_creator_on_cooldown())
  Never wrapped by protection-service.ts at all, by design, pending
  ADR-013. Nothing exists at the service layer to expose.
  Condition: ADR-013 approved.
```

## Requires ADR/Architecture Decision (exposure would functionally decide or pre-empt an open question)

```text
Intelligence -- getReputationLeaderboard()
  ADR-014 (leaderboard visibility) and ADR-015 (scoring formula)
  both unresolved. Exposing this, even read-only, risks presenting a
  gated/provisional feature as live.
  Condition: both ADRs approved; leaderboard exposure re-scoped as
  its own EWP once the approved visibility/scoring model is known.

Intelligence -- recalculateMemberReputation(), recalculateCreatorReputation(),
recalculateCommunityReputation()
  ADR-015, directly -- recalculating a formula that is itself
  provisional.
  Condition: ADR-015 approved.

Intelligence/Payment -- createPerformanceBonus() (shared)
  Highest financial-mutation risk in the codebase; moves real
  credits; shared across two domains.
  Condition: dedicated security review, informed by whatever
  Payment's own wallet-read architecture decision (above) produces.

Payment -- credit purchase / crediting
  No implementing procedure exists yet -- this is the exact gap
  ADR-017 exists to resolve. Not a Phase 6 decision to make.
  Condition: ADR-017 approved and its procedure implemented via a
  new migration.
```

## Structurally Absent (no capability exists at the service layer to expose or defer)

```text
Notification -- any read capability
  buildNotificationContent() is a pure content-mapping function with
  no database read; no list*/get* capability exists.
  Condition: a list* capability is deliberately built at the service
  layer first (a Phase 5-style domain-service change), not something
  the API layer can decide on its own.
```

This register will be revisited, not silently superseded, at the Phase 6 Final Acceptance Audit and at any future point one of these conditions is met.

---

# Next Step

**Phase 6 is FROZEN, 2026-07-18 (v0.6.0).** The Phase 6 Chief Architect Final Acceptance Audit scored 10/10 with zero Major/Critical findings and was Founder-approved on 2026-07-18 -- see `docs/phase-6-completion.md` for the full report and freeze record.

**Next Step is deliberately not defined here.** Per the Founder/Chief Architect's explicit instruction, Phase 7 is not automatically the next domain/API sequence continuation. A dedicated **Phase 7 Readiness & Direction Review** will determine the correct next architectural milestone from the full PCGH vision, remaining ADRs, technical debt, infrastructure requirements, and product priorities -- not yet performed as of this freeze.

**Standing architectural note (2026-07-18):** the opaque-string path-ID convention (no app-layer UUID format validation, relying on the service/database boundary to resolve a malformed id to a safe 404) is an established convention across Campaign and Discovery, not an immutable rule. If strict UUID validation is ever introduced, it must be evaluated and applied consistently across the whole API, not ad hoc in a single domain.

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
