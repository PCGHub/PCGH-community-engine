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
