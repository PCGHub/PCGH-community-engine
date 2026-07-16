# PCGH Implementation Playbook — Phase 5

## Hierarchy Level

Level 1 — Project Governance

## Status

ACTIVE — reviewed and approved by the Founder, 2026-07-15, per `docs/phase-4-completion.md`.

## Phase

Phase 5 — Application Implementation

---

# Purpose

This document is the coding governance guide for Phase 5 — Application Implementation: Backend Services, the three dashboards (Admin, Creator, Community), and the Analytics Dashboard, per `docs/phase-2-roadmap.md`'s Steps 5-10.

It translates rules already approved in `CLAUDE.md`, `docs/implementation-rules.md`, and `docs/documentation-governance-framework.md` into concrete practice for application code. It introduces no new architecture, business logic, or authority structure — every rule below cites the already-locked source it comes from. Where Phase 5 raises a genuine open question, this document says so and points to the Architecture Change Lifecycle rather than deciding unilaterally.

This is a draft. It does not become ACTIVE until reviewed under the same Architecture Change Lifecycle it describes (`docs/documentation-governance-framework.md` §5a).

---

# 1. Scope of Phase 5

Per `docs/phase-2-roadmap.md`, Phase 5 covers:

```text
Backend Services

API Layer consumption

Administrative Dashboard

Creator Dashboard

Community Application

Analytics Dashboard
```

The database layer (Phase 3, migrations 001-009) is complete and locked (`docs/database-implementation-complete.md`). Phase 5 builds *on top of* it. Phase 5 work does not modify any migration, any schema document, or any RLS policy — that would re-enter the Architecture Change Lifecycle, not proceed as ordinary application coding.

---

# 2. The One Rule That Governs Everything Else

```text
Every application consumes the api schema.

No application queries identity, economy, discovery,
protection, intelligence, analytics, or governance directly.
```

This is not a new rule — it is `docs/api-schema.md`'s own stated purpose, restated as the central constraint for Phase 5: "Every PCGH application should consume this API layer instead of querying business tables directly." Every other rule in this document exists to protect this one.

Practical consequence: a dashboard needing wallet data calls `api.wallet_summary_view`, not `economy.credit_wallets`. A service needing to close a campaign calls `api.close_campaign()`, not an `UPDATE` against `economy.campaigns`. If the API layer doesn't yet expose what a feature needs, the fix is a new or revised API object proposed through the Architecture Change Lifecycle — not a direct business-schema query bypassing it.

---

# 3. Backend Rules

Per `CLAUDE.md` ("Backend"):

```text
Next.js

Supabase

TypeScript -- never JavaScript

Strict typing always
```

Additional Phase 5-specific rules:

- The Supabase `service_role` key is for trusted backend code only (server-side, never shipped to a browser or mobile client). Every `SECURITY DEFINER` routine in `008_create_api_schema.sql` treats `auth.uid() is null` as a signal of trusted service-role context — if that key ever reaches client-side code, this entire authorization model is defeated. This is a hard rule, not a style preference.
- Backend services call stored procedures via `CALL`, functions via `SELECT`, and read via views — matching the object types `docs/api-schema.md` defines, not ad hoc RPC wrappers that duplicate their logic.

---

# 4. Frontend Rules

Per `CLAUDE.md` ("Frontend"):

```text
React

TypeScript

Tailwind

Reusable components

No duplicated UI
```

Additional Phase 5-specific rules:

- Dashboards consume `api.*` views for reads, matching each dashboard's documented data ("creator_dashboard_view" for the Creator Dashboard, "community_dashboard_view" for the Community Application, etc., per `docs/api-schema.md`).
- Where an API view's field is documented but currently unpopulated for a given role due to RLS (see Section 8), the frontend must handle that as a legitimate empty/`NULL` state — not work around it with a direct table query or a hardcoded fallback value.

---

# 5. Coding Standards

Per `CLAUDE.md` ("Coding Standards"), unchanged for Phase 5:

```text
Readable

Maintainable

Modular

Production quality

No dead code

No commented code

No temporary hacks
```

No feature flags or shims for backwards compatibility — per `CLAUDE.md`, change the code directly rather than branching around it.

---

# 6. Security Rules for Application Code

- Never bypass RLS from application code. If a legitimate feature needs data RLS currently blocks, that is an architecture question (Section 8), not an application-layer workaround.
- Never call an API function/procedure with an unvalidated actor identity where one is required (e.g. do not let client code freely set `p_approved_by` or `p_created_by` to an arbitrary user — pass the authenticated caller's own id).
- Treat every `SECURITY DEFINER` routine as administrative unless its own documentation says otherwise. Do not expose direct client-side calls to routines meant for backend/admin use only.

---

# 7. The Architecture Change Lifecycle Applies to Phase 5 Too

Per `docs/documentation-governance-framework.md` §5a:

```text
Proposal
    ↓
Architecture Review
    ↓
ADR
    ↓
Documentation Update
    ↓
Implementation
```

A dashboard or service needing new business logic — a new scoring rule, a new access boundary, a new table, a new API object — is a Proposal, not a pull request. Application code implements what the (possibly still-placeholder) API layer already exposes; it does not invent the business rule the API layer is missing.

Concretely: if a feature needs "real" reputation scoring and only the placeholder formula exists (`api.calculate_member_reputation()` et al., pending ADR-015), the correct action is to raise it for Architecture Review — not to compute a different score in the frontend or in a new backend service that duplicates and diverges from the documented function.

---

# 8. Respecting Currently Open ADRs

Three items are logged as `PROPOSED` in `docs/architecture-decisions.md` and must be treated as **not yet decided**, not as gaps to route around:

```text
ADR-013 -- Creator Protection Visibility
ADR-014 -- Public Reputation Leaderboards
ADR-015 -- Reputation & Trust Scoring Model
```

Until each is resolved:

- Do not build a creator-facing cooldown display by querying `protection.*` directly or via a new bypass function — `api.creator_protection_view` deliberately omits this field, and that omission is intentional pending ADR-013.
- Do not build a public leaderboard UI backed by a workaround (e.g., a new `SECURITY DEFINER` function added ad hoc) — `api.reputation_leaderboard_view`'s admin-only-in-practice behavior is intentional pending ADR-014.
- Do not present placeholder reputation/trust/consistency/amplification scores as final in user-facing copy. Label them as provisional if shown at all, pending ADR-015.

---

# 9. Documentation Ownership for Phase 5

Extending `docs/documentation-governance-framework.md` §12 (Documentation Ownership) to application code, using the same already-established hierarchy — no new authority is introduced:

```text
Application Code
(apps/*, services/*, packages/*)

Owner: Chief Engineer
Design authority for new business logic: Chief Architect,
via the Architecture Change Lifecycle (Section 7 above)
Final approval: Founder
```

Every new Level 1/2/3 document Phase 5 produces must declare its Hierarchy Level and Status at creation, per `docs/documentation-governance-framework.md`'s existing Documentation Governance Rules — this playbook does so above.

---

# 10. Git Workflow

Per `CLAUDE.md` ("Git Workflow"), unchanged:

```text
Implement
    ↓
Review
    ↓
Commit
    ↓
Push
```

Never commit broken code. Never skip review by routing around the Conflict Resolution Process when a genuine disagreement arises (`docs/documentation-governance-framework.md` §7).

---

# 11. Definition of Done (Phase 5)

A Phase 5 change is done when:

```text
[ ] It consumes the api schema exclusively -- no direct
    business-schema queries from application code

[ ] It compiles with no syntax or type errors (strict TypeScript)

[ ] It introduces no new business logic without an approved ADR

[ ] It does not bypass RLS or expose service_role to the client

[ ] It does not silently work around an open ADR (Section 8)

[ ] It has been exercised end-to-end, not just type-checked

[ ] Any new documentation declares its Hierarchy Level and Status

```

---

# 12. Implementation Checklist

```text
□ Architecture followed

□ Implementation Rules followed

□ Documentation unchanged (unless required)

□ No ADR violations

□ No temporary shortcuts

□ Security preserved

□ Tests (if applicable)

□ Repository clean

□ Ready for review

□ Ready for commit
```

---

# Playbook Status

```text
Document:
docs/implementation-playbook.md

Hierarchy Level:
1

Phase:
5

Status:
ACTIVE

Approved:
2026-07-15, per docs/phase-4-completion.md
```
