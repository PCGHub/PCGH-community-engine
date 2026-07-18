# API Layer Architecture

Status:
✅ APPROVED — LOCKED, Founder approval 2026-07-17. No review comments were raised against the DRAFT prior to approval; nothing was incorporated because nothing was outstanding.

Canonical Status:
This is the canonical API architecture document for Phase 6. All endpoint implementations must conform to it. A deviation is permitted only where a future ADR explicitly authorizes an exception (per AGR-002/AGR-006) — and any such deviation requires updating this specification first, never after the fact. See "Amendment Rule," below.

Phase:
Phase 6 — API Foundation & Application Layer (EWP-001)

Hierarchy Level:
Level 2 — Architecture

Note:
This document populates the `docs/api-specification.md` placeholder first declared in `documentation-governance-framework.md` Section 9 ("Placeholder Document Policy") and deferred there under Section 10 ("Scope Boundaries for Future Implementation Architecture") until "Backend Services and the API layer move from design to build" — which this document marks.

---

# Purpose

This document defines the HTTP API layer (`backend/app/api/`) that will sit in front of the domain services built in Phase 5: routing, versioning, the authentication and observability integration, request validation, the response contract, and middleware conventions. It governs Phase 6 Step "EWP-001 — API Foundation & Application Layer" and every endpoint implemented after it.

It does not redefine anything Phase 5 already established. Domain services (`app/services/`), domain models (`app/domains/`), the `api` schema, and RLS are unchanged — this document describes the new layer that calls them, per `docs/backend-architecture.md`'s "Thin API Layer" principle and Request Flow diagram (Client → Authentication → Authorization → Validation → Controller → Application Service → API Schema → Database → Response).

Per `docs/engineering-principles.md` AGR-001, this document exists specifically so that endpoint implementation does not begin without it.

---

# Scope

In scope:

```text
Thin-controller principle (restated for this layer specifically)
Routing conventions (Next.js Route Handlers under app/api/)
Versioning strategy
Authentication integration -- which Phase 5 mechanism controllers use
Authorization (RLS remains final; controller-level checks are advisory)
Request validation conventions
Response contract (success and error envelope, status code mapping)
Middleware conventions
Observability integration (extending the Phase 5 Step 15 pattern)
Rate limiting -- addressed explicitly, not silently deferred
```

Out of scope (unchanged by this document):

```text
Domain service logic -- app/services/* is called, not modified
The api schema -- docs/api-schema.md, unchanged
RLS -- authentication-architecture.md's Authorization Model, unchanged
Frontend dashboards -- docs/frontend-architecture.md, unchanged; the
  four existing dashboards continue reading via
  config/supabase-server.ts's cookie-based session, not this API layer
Which ADRs are open -- ADR-013/014/015/017 remain open and
  unaffected; no endpoint may expose or assume their resolution
```

---

# 1. Thin Controller Principle

Restated from `docs/backend-architecture.md`'s "Thin API Layer" and codified as `docs/engineering-principles.md` EPR-001's sibling for this layer: a controller (a Next.js Route Handler under `app/api/`) does exactly five things, in order, and nothing else:

```text
1. Authenticate  -- resolve the caller's identity (Section 4)
2. Authorize     -- advisory only; RLS is final (Section 5)
3. Validate      -- check the request shape (Section 6)
4. Call a service -- exactly one domain service function (never
                     inline business logic, never a second service
                     call to "help")
5. Format the response -- per the contract in Section 7
```

A controller that does anything beyond these five steps -- computing a score, branching on business state, aggregating multiple services' results into a new shape -- has become a service and must be moved into `app/services/`, per EPR-001 (Thin Service Principle) applied symmetrically to this layer.

---

# 2. Routing Conventions

Routes live under `app/api/v{n}/` (Section 3 for versioning), organized by domain, matching `docs/domain-architecture.md`'s ownership map one-to-one:

```text
app/api/v1/campaigns/route.ts                    GET (list), per
                                                  listCampaignSummaries
app/api/v1/campaigns/[campaignId]/route.ts       GET (one), per
                                                  getCampaignSummary
app/api/v1/campaigns/[campaignId]/distribute/route.ts   POST, per
                                                  distributeCampaign
app/api/v1/campaigns/[campaignId]/rotate/route.ts        POST
app/api/v1/campaigns/[campaignId]/close/route.ts         POST
app/api/v1/campaigns/[campaignId]/archive/route.ts       POST
app/api/v1/campaigns/[campaignId]/restore/route.ts       POST
```

**Built, EWP-002 (2026-07-18):** All seven routes above, plus one additive read route not originally listed here -- `app/api/v1/campaigns/[campaignId]/performance/route.ts` (GET, per `getCampaignPerformance`), an existing campaign capability per EWP-002's own scope ("expose only existing campaign capabilities"). A routine, non-deviating addition per the Amendment Rule, not a deviation.

Two route shapes, chosen per endpoint based on what the underlying service function actually is:

```text
Resource routes (GET only, for now): map directly to a service's
  get*/list* function. Plural collection route for list*, singular
  /{id} route for get*.

Action routes (POST): for service functions that are not CRUD
  (distribute/rotate/close/archive/restore/award/revoke/recalculate/
  create*), expressed as POST /{resource}/{id}/{action}. This is a
  deliberate, standard REST extension for action-style operations --
  not every domain operation maps cleanly to GET/POST/PATCH/DELETE,
  and forcing one that doesn't would be exactly the kind of premature
  "improve architecture because it could be better" this project's
  governance rejects.
```

Every domain gets its own route folder (`campaigns/`, `discovery/`, `protection/`, `intelligence/`, `analytics/`, `governance/`, `payments/`, `notifications/`), mirroring `app/services/`. No route folder calls more than one domain's service directly except where an Application Service already legitimately spans domains (e.g. Payment's re-exported `createPerformanceBonus`, per EPR-002).

---

# 3. Versioning Strategy

URL path versioning: every route lives under `app/api/v1/`. `v1` is the only version at this document's approval.

```text
A breaking change to a response shape, a required field, or a
  status-code meaning requires a new version segment (app/api/v2/),
  never a breaking change to v1 in place.

Additive, backward-compatible changes (a new optional field, a new
  endpoint) do not require a new version.

v1 has no declared sunset date. Deprecating a version is an
  Architecture Change Lifecycle decision (AGR-002), not an
  implementation-time choice.
```

---

# 4. Authentication Integration

**Decision: controllers use the existing `app/auth/middleware.ts`'s `authenticate()` function exactly as originally designed in Phase 5 Step 3 -- not `config/supabase-server.ts`.**

This resolves the "Known Future Work" item recorded in `docs/technical-debt.md`'s Reclassified entry ("when an `app/api/` Controller layer is actually built... decide then whether it calls the existing `app/auth/middleware.ts`... or a Route-Handler-adapted equivalent of `config/supabase-server.ts`"). The evidence points the same direction the original design already anticipated:

```text
authenticate(request: Request) already takes exactly the object type
  a Next.js Route Handler receives (`export async function
  POST(request: Request)`) -- no adaptation needed, it was built for
  precisely this shape.

It reads a Bearer token from the Authorization header -- the
  standard convention for a callable HTTP API (as opposed to a
  browser session cookie, which is what config/supabase-server.ts
  is for). A caller of this API (a future first-party client, a
  script, a future mobile app) sends `Authorization: Bearer <token>`,
  not a cookie.

It already resolves both session (resolveSession -- 
  identity.current_user_id()) and roles (resolveRoles --
  identity.is_admin() / identity.user_roles), fully unit-tested,
  per Phase 5 Step 3's Exit Criteria.
```

`config/supabase-server.ts` remains exactly what it is -- the Server Component session reader for the four existing dashboards -- and is not touched, retired, or adapted by this document. The two mechanisms serve two different callers (a browser rendering a page vs. an HTTP client calling an API), which is a legitimate reason for both to exist, not a duplication to resolve.

**Controller usage convention:**

```text
Every controller's first line calls authenticate(request).
If it returns null, the controller responds 401 Unauthorized
  immediately (Section 7) and calls no service. This is the fail-
  closed behavior EPR-004 already requires, applied at this layer.
If it returns an AuthContext, the controller passes
  authContext.session.accessToken to the domain service function
  it calls -- exactly the same accessToken parameter every Phase 5
  service function already accepts. No new parameter, no new
  service signature.
```

---

# 5. Authorization

Unchanged from `authentication-architecture.md`'s Authorization Model and `docs/engineering-principles.md` AGR-005: RLS and each `api.*` routine's own `SECURITY DEFINER` check are the final authority. `authContext.roles` (from `authenticate()`) is available to a controller for UX purposes only (e.g. deciding whether to even attempt an admin-only action and return a clearer error) -- a controller never uses it to grant access RLS would otherwise deny, and never uses it to deny access RLS would otherwise allow.

---

# 6. Validation Conventions

No schema-validation library (Zod, Yup, or similar) is approved or introduced by this document. Adopting one is a genuine new dependency decision -- per AGR-002 and `docs/engineering-principles.md` EPR-006 ("No Unapproved Vendor Decisions"), that is an Architecture Change Lifecycle proposal, not something decided inside an architecture document for a different purpose.

For v1, validation is explicit and hand-written per endpoint, matching the same "boring, explicit code" preference already demonstrated throughout Phase 5's service layer:

```text
A controller checks required fields are present and are the
  expected primitive type (string/number/array) before calling its
  service. Missing or wrong-shaped input returns 400 Bad Request
  (Section 7) without calling the service at all.

Validation logic is inline in the controller, not extracted into a
  shared "validator" module -- until a second endpoint's validation
  need is complex enough to justify one, per the same
  "three similar lines beat a premature abstraction" standard
  applied everywhere else in this project.

If hand-written validation becomes unwieldy as more endpoints are
  added, adopting a schema-validation library is a future proposal,
  not a default assumed here.
```

**EWP-001 clarification (2026-07-17, not a deviation):** `app/api/_lib/validation.ts` provides generic, endpoint-agnostic primitives -- `isNonEmptyString`, `isStringArray`, `isNumber`, `getMissingFields`, `parseJsonBody`. These are type guards and a field-presence check with zero knowledge of any specific endpoint's shape. This is consistent with, not a violation of, "not extracted into a shared validator module" above -- what stays inline per endpoint is the *composition* (which fields a given request needs, and which primitive checks each one), never delegated to a shared module that would need to know about that endpoint.

---

# 7. Response Contract

Every endpoint returns one of exactly two envelope shapes:

```ts
// Success
{ data: T }

// Error
{ error: { code: string; message: string } }
```

Status code mapping, derived from what Phase 5's service layer already does (per `docs/engineering-principles.md` DSR-005: reads return null/empty on failure, mutations throw):

```text
200 OK               A read returned data, or a mutation succeeded
                      (body: { data: ... }, or { data: null } for a
                      void mutation)
400 Bad Request       Validation failed (Section 6)
401 Unauthorized       authenticate(request) returned null (Section 4)
404 Not Found          A get*/list* service function returned
                       null/empty -- unchanged: this still correctly
                       conflates "does not exist" with "not visible
                       to this caller under RLS" for reads, per
                       authentication-architecture.md (RLS-restricted
                       data is a legitimate empty state, never
                       distinguished from absence). A thrown mutation
                       error may also classify as 404 -- see below.
403 Forbidden          An admin-gate check failed.
409 Conflict           A genuine request/resource-state conflict
                       (reserved for future use -- see audit below;
                       no current routine produces this).
500 Internal Server Error  An unexpected or unclassified failure.
```

## Error Classification (TD-005 resolution, EWP-002 hardening, 2026-07-18)

**Audit performed** (per the Founder's Chief Architect Review): every `raise exception` in `008_create_api_schema.sql` was read directly, not sampled or guessed from one route. Complete result, across every mutating routine currently wrapped by a domain service (Campaign, Intelligence):

```text
11x "Only administrators may <verb> <noun>" -- identical prefix,
    across both Campaign (5 routines) and Intelligence (6 routines).
    Always the FIRST check in every routine that has one.

2x  "Campaign % not found" (distribute_campaign, rotate_campaign) --
    always occurs AFTER the admin-check in the same routine, never
    before, never in a routine without one.

1x  A genuine configuration-state message
    (rotate_campaign's missing DEFAULT_COOLDOWN_DAYS) -- not an
    admin check, not a not-found case.

0x  A genuine request/resource-state conflict (409) case -- see
    "On 409," below.

Separate finding, not an error-classification issue:
close_campaign/archive_campaign/restore_campaign never raise "not
    found" at all -- a non-existent or wrong-status campaign ID
    silently produces a 0-row UPDATE and a 200 success response.
    Logged as docs/technical-debt.md TD-006, not fixed here (fixing
    it means adding an existence/status check to those three SQL
    procedures -- a migration change, out of scope for an error-
    classification hardening pass).
```

**Security analysis (the fail-closed constraint):** distinguishing 403 from 404 is safe because the admin-check always runs, and always fails, *before* any existence check, in 100% of audited cases. A non-admin caller is rejected identically (403, same message) regardless of whether the target resource exists -- they can never use this to enumerate resource IDs. Only an already-fully-privileged admin (who already has full RLS visibility, per every business-schema RLS policy's `identity.is_admin()` clause) can ever reach the 404 branch, and seeing "not found" there discloses nothing they couldn't already see via a direct read of the same resource. Reads are entirely unaffected by this change -- the null-to-404 rule above is unchanged.

**Architecture decision:** a shared, generic, domain-agnostic classifier in `app/api/_lib/errors.ts`, not a `distribute_campaign`-specific patch and not a change to any domain service:

```text
1. Typed errors (NotFoundError, ConflictError, ForbiddenError,
   exported from errors.ts) -- an explicit, non-fragile escape hatch
   any future service MAY throw directly. No current Phase 5 service
   is modified to use these; they exist for forward compatibility.

2. Message-pattern fallback, for the plain Error every current
   mutating service function already throws, unmodified:
     - starts with "Only administrators may "  -> 403
     - ends with "not found" (case-insensitive)  -> 404
     - anything else                             -> 500, with the
       real message logged server-side but never returned to the
       client (only "An unexpected error occurred" is), so an
       unclassified internal error never leaks implementation
       details.
```

This is deliberately not a per-route or per-domain patch: both patterns were verified identical across two unrelated domains (Campaign, Intelligence), so a single shared classifier generalizes correctly without hardcoding any domain's vocabulary.

**On 409:** no genuine conflict case exists in the currently audited SQL surface. The one borderline candidate (`rotate_campaign`'s missing `DEFAULT_COOLDOWN_DAYS`) is deliberately classified as 500, not 409 -- it reflects a server misconfiguration independent of the request or the resource's state, which is what 500 means; a true 409 would be something like "cannot restore a campaign that isn't archived," which no current routine actually checks for (see TD-006's related silent-no-op finding). `ConflictError` is exported and ready for that case whenever a routine actually implements it -- not invented here.

**Not an Architecture Change Lifecycle item:** this refines the mapping logic within the response contract Section 7 itself already flagged as an explicitly open question ("revisit if a service ever throws for a genuinely different reason... not resolved by this document") -- it does not change the envelope shape, does not alter RLS or any authorization decision, and does not introduce a new domain or external dependency. Documented here, before the corresponding code change, per this document's own Amendment Rule.

List endpoints (`GET` on a collection route) additionally include a `pagination` field:

```ts
{ data: T[]; pagination: { limit: number; offset: number; total: number } }
```

**Dependency this creates, stated plainly:** none of Phase 5's `list*` service functions (`listCampaignSummaries`, `listCommunityDashboards`, `listDiscoverySummaries`, `listOwnExclusions`, `listBadges`) currently accept a `limit`/`offset` or return a `total` -- they fetch everything the caller's RLS allows in one call. `CLAUDE.md`'s Performance section already requires "Paginate large datasets." Adding pagination parameters to these service functions is necessary, in-scope follow-up work for the endpoint implementation step that follows this document -- not done here, since this document's job is architecture, not service-layer changes.

**Resolved at the controller level, EWP-002 (2026-07-18):** `app/api/_lib/pagination.ts` slices the already-fully-fetched array and computes the true `total` in the route handler, satisfying the response contract without any domain-service change -- `GET /api/v1/campaigns` is the first list route built this way. This does not reduce the query cost for a very large dataset (the full RLS-scoped set is still fetched every call); true server-side pagination in the domain service remains better long-term and is still not solved here.

---

# 8. Middleware Conventions

No Next.js root `middleware.ts` is introduced. Per `app/auth/middleware.ts`'s own header (unchanged since Phase 5 Step 3) and the Thin Controller principle (Section 1), authentication is invoked by each controller, not by a global interceptor -- a root `middleware.ts` would run against every route including the four existing dashboards and the static home page, which do not use this authentication path (Section 4) and should not be forced through it.

A small, shared controller helper (e.g. a `withAuth()` wrapper that calls `authenticate()` and produces the 401 response on failure) is anticipated to reduce repetition across ~15+ route handlers, but is implementation, not architecture -- it is not built by this document. When built, it must contain zero business logic (matching Section 1) and must not become a place where authorization or validation decisions are silently made on the API layer's behalf.

**Built, EWP-001 (2026-07-17):** `app/api/_lib/handler.ts`'s `withAuth()` implements exactly this -- resolves a requestId, calls `authenticate()`, returns 401 on failure without invoking the handler, and centralizes the try/catch that maps a thrown service error via `errors.ts` (Section 7). It contains no business logic and makes no authorization or validation decision of its own, per the constraint above.

**Extended, EWP-002 (2026-07-18):** `withAuth()` now also accepts and forwards Next.js's dynamic route `context.params` (e.g. `{ campaignId: string }`), needed for every `[campaignId]/route.ts`-style route -- EWP-001's health route had no dynamic segment, so this gap wasn't exercised until the first domain routes. `context` defaults to an empty-params object, so non-dynamic routes are unaffected. A routine completion of the wrapper's intended purpose, not a deviation from it.

---

# 9. Observability Integration

Extends the pattern already resolved in `docs/technical-debt.md` TD-003, using the same utilities, unchanged:

```text
Every controller generates one requestId (generateRequestId()) at
  the top of the handler, before calling authenticate().

The same requestId is passed to the domain service call (every
  Phase 5 mutating service function already accepts request-scoped
  context implicitly via its own internal generateRequestId() call --
  for v1, the controller's requestId and the service's own internal
  one are logged separately rather than threaded through a new
  parameter, since changing every service signature to accept a
  requestId is a service-layer change this document does not make).

logger.info/error records the route, method, status code, and
  requestId for every request -- a controller-level log line
  distinct from the service-level audit/metric events TD-003 already
  wired in, not a replacement for them.
```

**Built, EWP-001 (2026-07-17):** `withAuth()` (Section 8) generates the `requestId` and logs `api.request.unauthorized`/`api.request.completed`/(via `errors.ts`) `api.request.failed`, exactly as described above.

---

# 10. Rate Limiting

`documentation-governance-framework.md` Section 10 explicitly flagged "API rate limiting / abuse prevention" as out of scope for the original Phase 2 framework, deferred until "the API layer move[s] from design to build" -- which is now. Addressed explicitly rather than silently dropped:

```text
No rate limiting is implemented in v1. Introducing one means either
  a new dependency (a rate-limiting library or a hosted service) or
  new infrastructure (a request-counting store) -- both are new
  External Integration / Architecture Change Lifecycle decisions
  (AGR-002), not defaulted to here.

This is an accepted gap for v1, not an oversight: there is no live
  production deployment yet (Phase 5 Step 15's own Deployment
  Preparation explicitly did not provision one), so there is no
  live abuse surface today. Rate limiting should be resolved before
  any live deployment of this API layer, not before this
  architecture document's approval.
```

---

# 11. Directory Structure

```text
backend/
└── app/
    └── api/
        ├── _lib/                    (EWP-001, built 2026-07-17)
        │   ├── response.ts          Section 7 envelope
        │   ├── errors.ts            Section 7 status-code mapping
        │   ├── validation.ts        Section 6 shared primitives
        │   └── handler.ts           Section 8 withAuth() wrapper
        └── v1/
            ├── health/route.ts      (EWP-001, public, unauthenticated
            │                        liveness check -- proves routing/
            │                        envelope/observability only)
            ├── campaigns/
            │   ├── route.ts
            │   └── [campaignId]/
            │       ├── route.ts
            │       ├── distribute/route.ts
            │       ├── rotate/route.ts
            │       ├── close/route.ts
            │       ├── archive/route.ts
            │       └── restore/route.ts
            ├── discovery/
            ├── protection/
            ├── intelligence/
            ├── analytics/
            ├── governance/
            ├── payments/
            └── notifications/
```

Every domain folder under `app/api/v1/` corresponds to exactly one domain's existing service in `app/services/`, per Section 2 -- not yet built by EWP-001 (see EWP-001's own scope note below). `app/api/_lib/` (the underscore prefix is a Next.js App Router convention marking a folder as never routable, regardless of its contents) holds the shared foundation built by EWP-001. No new top-level `app/` directory is introduced -- `app/api/` already exists (Phase 5 Step 1 scaffold) and was always intended for this.

**EWP-001 scope note (2026-07-17):** EWP-001 delivered the shared foundation (`_lib/` and the `v1/health` liveness route) only, per its own explicit scope -- no domain-specific route (`campaigns/`, `discovery/`, etc.) is implemented yet. Those are later work packages, each conforming to this specification exactly.

**EWP-002 scope note (2026-07-18):** The Campaign domain's eight routes (Section 2) are now built -- the first domain work package, and the first to exercise dynamic `[campaignId]` routing, POST bodies, and the `_lib` foundation end-to-end. `discovery/`, `protection/`, `intelligence/`, `analytics/`, `governance/`, `payments/`, and `notifications/` remain not yet implemented, per EWP-002's own scope ("the first domain work package," singular).

---

# 12. Dependencies

```text
docs/backend-architecture.md ("Thin API Layer," Request Flow)
docs/authentication-architecture.md (Session Management,
  Authorization Model -- unchanged)
docs/domain-architecture.md (routing organized by domain ownership)
docs/service-architecture.md (which service each route calls)
docs/engineering-principles.md (AGR-001, AGR-002, AGR-005, EPR-001,
  EPR-002, EPR-004, EPR-005, EPR-006, DSR-005 -- all cited above)
docs/technical-debt.md (TD-003's observability pattern extended;
  the Reclassified entry's Known Future Work item resolved by
  Section 4)
app/auth/middleware.ts, session.ts, roles.ts (Phase 5 Step 3,
  reused unchanged)
```

---

# 13. Implementation Rules

```text
Never call an api.* view/function/procedure directly from a
  controller -- always through exactly one domain service function
  (Section 1)

Never introduce a schema-validation library or a rate-limiting
  dependency without an Architecture Change Lifecycle proposal
  (Sections 6, 10)

Never use config/supabase-server.ts's cookie-based session in an
  app/api/ route -- that mechanism is for the dashboards only
  (Section 4)

Never add a root middleware.ts -- authentication stays
  controller-invoked (Section 8)

Never return a response shape other than the two envelopes in
  Section 7

Never skip request validation (Section 6) even for an
  internal-seeming endpoint

Never implement an endpoint that deviates from this specification's
  routing, versioning, authentication, validation, response-contract,
  or middleware conventions without first updating this document --
  never after the fact (see "Amendment Rule," below)
```

---

# Amendment Rule

This document is the canonical API architecture reference for Phase 6, per the Founder's standing instruction (2026-07-17). That status carries one binding rule:

```text
A deviation from anything this specification requires -- a different
  response envelope, a different auth mechanism, a route that
  bypasses a domain service, a new validation library, a rate-limit
  implementation -- is permitted only where a future ADR explicitly
  authorizes it (per AGR-002/AGR-006).

The specification is updated FIRST, reflecting the approved
  deviation, and only THEN is the deviating endpoint implemented.
  An implementation that deviates and is documented afterward is a
  defect, not a shortcut -- consistent with AGR-001 (Documentation
  Precedes Implementation) applied to amendments as much as to the
  original document.

Routine, non-deviating additions (a new endpoint for an existing
  domain that follows every existing convention exactly) do not
  require amending this document first -- only a deviation from an
  existing rule does.
```

---

# Testing Conventions

Per the Founder's Phase 6 Testing Directive (2026-07-17) and `docs/engineering-principles.md` QGR-006: every new API route ships, as part of the same work package that introduces it, with all three of the following -- none deferred to a later testing pass.

```text
Unit tests (backend/tests/unit/api/): cover new logic in isolation --
  a new validation composition, a new response-shaping helper, a new
  _lib addition. Same mocked-client pattern Phase 5 established
  (tests/helpers/mock-supabase-client.ts) where a domain service is
  involved.

Integration tests (backend/tests/integration/api/): exercise the
  complete HTTP request lifecycle for that specific route -- import
  the real route handler, call it with a real-shaped Request, mock
  only the true external boundaries (authenticate(), the domain
  service function), and assert on the actual Response returned
  (status, envelope shape). One test file per route, not per _lib
  module.

Documentation updates: this specification is updated in place for
  any new endpoint or architectural clarification the route required
  (matching the pattern already used for EWP-001's own build-record
  updates to Sections 6, 8, 9, and 11) -- per the Amendment Rule
  above, before the deviating case, if any, is implemented; for a
  routine addition, alongside it.
```

`backend/app/api/v1/health/route.ts` (EWP-001) is the first route to receive an integration test under this convention, at `backend/tests/integration/api/health.test.ts` -- applied retroactively to the one route that existed before this directive, not just prospectively.

---

# 14. Success Criteria

This architecture was ready for implementation when (all satisfied, 2026-07-17):

```text
Thin controller principle is documented           -- done, above
Routing conventions are documented                -- done, above
Versioning strategy is documented                 -- done, above
Authentication integration is decided and documented -- done, above
  (resolves the TD-004 Known Future Work item)
Authorization is documented                       -- done, above
Validation conventions are documented              -- done, above
Response contract is documented                   -- done, above
Middleware conventions are documented               -- done, above
Observability integration is documented            -- done, above
Rate limiting is explicitly addressed              -- done, above
Reviewed and approved by Founder / Chief Architect -- GRANTED,
  2026-07-17
```

Endpoint implementation (EWP-001's build phase) may now begin, conforming exactly to this specification, per the Amendment Rule above.
