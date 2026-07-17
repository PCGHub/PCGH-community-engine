# Technical Debt Log

Status:
ACTIVE — living log

Hierarchy Level:
Level 4 — Conceptual References (Non-authoritative for implementation)

Authority Note:
This register is a non-authoritative engineering reference. It does
not govern, approve, or decide anything, and it never overrides any
Level 1-3 document. It exists only to track known, already-approved
implementation shortcuts so they are not forgotten -- not to record
project governance.

Purpose:
Records known, approved deviations from the ideal implementation that
are accepted for now and must be resolved later. An entry here is not
an open architecture question (those are ADRs/Proposals under
`docs/documentation-governance-framework.md` §5a) — it is a scoped,
already-approved shortcut with a defined resolution condition.

---

## TD-001 — Direct `identity.*` RPC calls in the Authentication Service

**Logged:** 2026-07-15, during Phase 5 Step 3 (Authentication) Founder review.

**Where:**
`backend/app/auth/session.ts` (`identity.current_user_id()`),
`backend/app/auth/roles.ts` (`identity.is_admin()`, `identity.user_roles`).

**What:**
These call the `identity` schema directly via `.schema('identity')`,
rather than through an `api.*` wrapper function. This is explicitly
authorized by `docs/authentication-architecture.md`'s "Dependencies"
section, which names `identity.current_user_id()` and
`identity.is_admin()` (not an `api.*` equivalent) as direct
dependencies of the Session/Role resolver — so it is not a violation
of that document. It is narrower than the general "API Schema First"
principle applied everywhere else in the backend (e.g. Phase 5 Step 4's
Identity Service reads only `api.creator_dashboard_view` /
`api.member_dashboard_view`).

**Why it's debt:**
No `api.*` wrapper for `current_user_id()` / `is_admin()` exists yet in
`008_create_api_schema.sql`. Once the API layer exposes equivalent
wrapper functions, the Authentication Service should call those instead,
so that authentication is consistent with every other domain service's
API-schema-only access pattern.

**Resolution condition:**
An `api.*` wrapper for identity/role resolution is added (new
migration, not a modification of 001 or 008) and the API layer is
otherwise finalized. At that point, `session.ts`/`roles.ts` should be
updated to call the wrapper instead of `identity.*` directly.

**Also depends on (not this item's debt, but a related open question):**
Both `identity` and `api` schemas must be exposed via the Supabase
project's Data API schema configuration for any of this to function —
a deployment/ops prerequisite for the whole backend, not unique to this
item.

---

## TD-002 — Direct `analytics.analytics_events` read via `service_role` in the Notification dispatch job

**Logged:** 2026-07-16, during Phase 5 Step 11 (Notifications) Founder review.

**Where:**
`backend/app/jobs/notification-dispatch-job.ts`.

**What:**
Reads `analytics.analytics_events` directly via `.schema('analytics')`,
using the `service_role` client (`createSupabaseServiceClient()`),
rather than through an `api.*` view with a user-scoped session. This is
explicitly authorized by `docs/domain-architecture.md`'s Notification
Domain section, which names `analytics.analytics_events` (read) — not
an `api.*` object — as its one direct dependency, since Notification
Domain owns no business schema of its own. `service_role` is used
because `analytics_events_admin_select` (migration 006) is
administrator-only, and a background job has no per-request user
session to hold an admin's token in the first place — this is the
documented "trusted backend automation" use case for `service_role`,
not a bypass of it. This file is never client-reachable.

**Why it's debt:**
No `api.*` view exposes `analytics.analytics_events` for reading. If
one is added (e.g. an admin-scoped event view, or a proper
webhook/trigger mechanism replacing polling), the dispatch job should
be updated to use it instead of a direct `service_role` schema read.

**Resolution condition:**
An `api.*` view or a dedicated event-delivery mechanism (e.g. Supabase
Database Webhooks) is introduced via a new migration, and
`docs/domain-architecture.md`'s Notification Domain dependency is
updated accordingly. At that point,
`notification-dispatch-job.ts` should be migrated off the direct
`analytics.analytics_events` read.

---

## TD-003 — Observability utilities built but not wired into any call site — RESOLVED

**Logged:** 2026-07-16, during the Phase 5 Final Hardening audit (Chief Architect review). **Classification sharpened:** 2026-07-17, per a focused evidence-based review against the exact roadmap/architecture text (see below). **Resolved:** 2026-07-17, as the final Phase 5 implementation task, per Founder direction.

**Resolution:** `recordAuditEvent()`, `recordMetric()`, and `generateRequestId()` are now called from every critical mutating operation identified below, using the utilities exactly as designed (no new logging framework, no change to any function's parameters, return type, or error-throwing contract):

```text
Campaign Service:      distributeCampaign, rotateCampaign,
                       closeCampaign, archiveCampaign, restoreCampaign
Intelligence Service:  awardBadge, revokeBadge,
                       recalculateMemberReputation,
                       recalculateCreatorReputation,
                       recalculateCommunityReputation,
                       createPerformanceBonus
Notification job:      runNotificationDispatch (per-event outcome)
```

Each records a structured `logger.error` on failure (before the existing `throw` -- unchanged) and a `recordAuditEvent()` + `recordMetric()` on success. `actorUserId` is set to the resolved actor where the function already receives one as a parameter (`rotateCampaign`'s `createdBy`, `createPerformanceBonus`'s `approvedBy`); elsewhere it is `null`, since no mutating function currently receives a resolved caller identity and inventing that resolution would mean reintroducing the Auth Service path this project just determined is intentionally not integrated (the Reclassified entry above) -- not a workaround, but a boundary this fix respects rather than crosses.

Re-verified after wiring: `npm run lint`, `npm run typecheck`, `npm test` (39/39 passing, console output confirms the new log/audit/metric lines genuinely fire during the existing tests, not just compile), and `npm run build` all pass. `service_role` re-confirmed absent from the built client bundle.

**Original entry, preserved for the record:**

**Where:**
`backend/app/utils/logger.ts`, `audit.ts`, `metrics.ts`, `tracing.ts`.

**Classification: incomplete Phase 5 deliverable — evaluated against Step 15's own Deliverables text.**

`docs/phase-5-roadmap.md` Step 15's Deliverables (verbatim): "Monitoring
and observability wiring (structured logs, audit records, metrics,
tracing identifiers)." Step 15's Objective explicitly cites its
governing source: "per `docs/backend-architecture.md`'s Observability
and External Integrations sections." That section (verbatim): "Every
critical operation should produce: structured logs, audit records,
metrics, tracing identifiers. **This area will be expanded during
production readiness.**" Step 15 *is* production readiness by its own
Objective's cross-reference — so this was the roadmap-designated point
for that Phase 4 aspiration to become real, not a future step.

What exists: four correctly-implemented, vendor-neutral utilities. What
does not exist: any call site. A full grep found zero call sites for
`recordAuditEvent()`, `recordMetric()`, or `generateRequestId()`
anywhere in `app/services/`, `app/jobs/`, or `app/(dashboards)/`.
"Wiring," in any plain reading of Step 15's own Deliverables text,
means connecting these to actual critical operations -- not building
standalone functions nothing invokes.

**Important qualifier, stated precisely rather than smoothed over:**
Step 15's actual Exit Criteria ("Production environment operational" /
"`service_role` key confirmed absent from every client-shipped
artifact" / "Rollback plan documented") does **not** test for
observability integration at all. Under the standard used to gate every
other step in this engagement (Exit Criteria is the pass/fail bar,
Deliverables is the target), Step 15 technically passed its own gate.
This is itself a genuine gap in the approved roadmap -- its Deliverables
and Exit Criteria for Step 15 don't match each other -- not something
to paper over. Both facts are true at once: Step 15 passed its stated
Exit Criteria, and its Deliverables text was not fully realized.

**Why it's debt:**
Today, no critical operation (badge award, campaign distribution,
wallet-affecting mutation, notification dispatch) leaves an audit trail
or emits a metric. If this shipped to production as-is, that would be
invisible until something went wrong.

**Resolution condition:**
Each domain service's mutating calls (campaign distribute/rotate/
close/archive/restore, badge award/revoke, reputation recalculation,
performance bonus creation, notification dispatch) are updated to call
`recordAuditEvent()`/`recordMetric()` at their success/failure points,
and a `requestId` (from `generateRequestId()`) is threaded through each
request's logger calls. This is unfinished Phase 5 Step 15 work per its
own Deliverables text, not optional future polish -- it should be
scheduled as real implementation work, not carried indefinitely as
background debt.

---

## Reclassified — Auth Service (Step 3) is intentional future infrastructure, not technical debt

**Originally logged:** 2026-07-16, during the Phase 5 Final Hardening audit, as "TD-004 — Two parallel, non-integrated session-resolution paths." **Reclassified:** 2026-07-17, per a focused evidence-based review against the exact roadmap text. Removed from the active debt list below (renumber note: no TD-004 exists; do not reuse the number for an unrelated item, to keep this log's history traceable).

**Where:**
`backend/app/auth/{session.ts, roles.ts, middleware.ts}` (Phase 5 Step
3, Bearer-token-based) vs. `backend/app/config/supabase-server.ts`
(Phase 5 Step 13, cookie-based).

**Why this is not debt:**
A debt item requires an approved document or roadmap step to have
required something that wasn't delivered. Searching every one of the
15 roadmap steps' Deliverables and Exit Criteria for `controller`,
`app/api`, `route handler`, or `authenticate()` being invoked returns
exactly three matches, all inside Step 1's folder-scaffold list and
Step 3's own text ("Auth middleware entry point (per the Thin
Controller principle — authentication is a controller
responsibility...)"). **No roadmap step, at any point, requires
building the Controller/API-route layer that would call it.**

Step 3's own Deliverables (Supabase client wrapper, Session resolver,
Role resolver, Auth middleware entry point) and Exit Criteria
("Login/logout/session validation functional," "Role resolution
matches identity.user_roles live," "service_role never exposed
client-side," "RLS remains the final authorization boundary") were all
fully satisfied *in isolation* — verified by passing unit tests
exercising every code path, independent of whether a consumer exists.
This is the same pattern already established and accepted for Step 2's
Storage/AI clients (built, functional, correctly unconsumed until
something needs them).

Step 13's dashboards satisfy *their own* Deliverables/Exit Criteria
(consume `api.*` views, handle RLS-driven empty states) via a
different, equally valid mechanism appropriate to Server Components —
nothing in Step 13's text required reusing Step 3's specific mechanism.
The two mechanisms exist for two different consumption patterns (a
future Bearer-token API layer vs. actual same-process Server
Components), not because either step's approved requirements were left
unmet.

**Standing note (not a resolution condition, since there is nothing to resolve):**
When an `app/api/` Controller layer is eventually built (not part of
any current roadmap step), that work should decide then whether it
calls the existing `app/auth/middleware.ts` (as originally designed) or
a Route-Handler-adapted equivalent of `config/supabase-server.ts` —
and retire whichever path is not chosen. Until that layer exists, both
pieces of infrastructure are legitimately idle, not broken.
