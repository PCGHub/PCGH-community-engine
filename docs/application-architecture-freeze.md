# Application Architecture Freeze

Status:
✅ LOCKED — ratified by the Founder, 2026-07-15

(Note: this file's skeleton originally pre-set `Status: LOCKED`, which was deliberately not carried forward when this document was first drafted — its entire purpose is to be the formal ratification event, so it would have been circular to declare itself already ratified before the review it exists to record had happened. That review has now happened: `docs/phase-4-completion.md` records Founder Approval as GRANTED on 2026-07-15, after the three issues in its "Pre-Approval Architecture Consistency Pass" were resolved. `LOCKED` here reflects that actual event, not the original pre-set placeholder.)

Phase:
Phase 4

Hierarchy Level:
Level 2 — Architecture

---

# Purpose

This document is the formal freeze point for the PCGH Phase 4 application architecture. Once ratified, it declares which documents constitute the approved application architecture, in what order they govern, and that no further architectural change may occur outside the Architecture Change Lifecycle.

It freezes decisions already made in the documents it lists. It does not make any new decision itself.

---

# Scope

This freeze covers the **application layer** only:

```text
docs/backend-architecture.md
docs/authentication-architecture.md
docs/service-architecture.md
docs/domain-architecture.md
```

It does not re-open, modify, or re-freeze the **database layer**, which is already complete and locked per `docs/database-implementation-complete.md` (migrations 001-009). Nothing in this document changes any schema, migration, or RLS policy.

---

# Frozen Decisions

The following decisions, already established across the four documents in Scope, are frozen as a set:

```text
API Schema First
  All application code consumes the api schema exclusively;
  no direct business-schema queries (docs/backend-architecture.md,
  docs/domain-architecture.md).

Thin Controllers, Rich Services
  Controllers validate/authenticate/authorize/call-a-service/
  format-response only; workflow logic lives in services
  (docs/backend-architecture.md, docs/service-architecture.md).

Modular domain boundaries
  Each domain owns exactly the schema(s) and api.* objects
  docs/domain-architecture.md assigns it; cross-domain work
  happens only through the api schema or a named Application
  Service (docs/domain-architecture.md).

Authentication via Supabase Auth
  identity.current_user_id() and identity.is_admin() are the
  canonical identity/role resolution path; no parallel
  authentication or permission system is introduced
  (docs/authentication-architecture.md).

RLS is the final authorization boundary
  Backend/application checks are advisory (UX, defense in
  depth); RLS, already enforced in 001-009, is authoritative
  (docs/authentication-architecture.md, docs/service-architecture.md).

service_role is never client-facing
  Confirmed across docs/backend-architecture.md,
  docs/authentication-architecture.md, and
  docs/implementation-playbook.md without exception.

Storage and AI are infrastructure, not business domains
  Neither owns a business schema; both are scaffolded under
  Phase 5 Step 2 (Core Infrastructure), not a dedicated
  domain-specific step (docs/domain-architecture.md,
  docs/service-architecture.md, docs/phase-5-roadmap.md).

The Economy schema is split across two domains
  economy.campaigns / campaign_asset / campaign_distributions
  -> Campaign Domain; economy.credit_wallets /
  credit_transactions -> Payment Domain
  (docs/domain-architecture.md).

Application stack is Next.js + TypeScript + Supabase
  Per CLAUDE.md's Backend section (Level 1, authoritative).
  One documented exception: the AI Service is a separate
  Python + FastAPI application, integrated only through a
  defined internal API contract, still bound by the api
  schema and RLS/service_role rules (docs/backend-architecture.md,
  ADR-016).

app/domains/ and app/services/ are distinct
  app/domains/ holds Domain Models (per-domain types/entities,
  no logic); app/services/ holds Domain Services (workflow
  logic that operates on those types), categorized per
  docs/service-architecture.md (docs/backend-architecture.md).
```

---

# Approved Documents

```text
Document                             Status at drafting  Status now (2026-07-15)
--------------------------------------------------------------------------------
docs/backend-architecture.md         DRAFT               ACTIVE
docs/authentication-architecture.md  LOCKED               LOCKED
docs/service-architecture.md         LOCKED               LOCKED
docs/domain-architecture.md          LOCKED               LOCKED
docs/implementation-playbook.md      DRAFT               ACTIVE
docs/phase-5-roadmap.md              ACTIVE               ACTIVE
```

This freeze did not silently upgrade any document's status at drafting time — `docs/backend-architecture.md` and `docs/implementation-playbook.md` were explicitly left `DRAFT` until the Review Process below was actually completed. That review has now happened: the Founder granted approval on 2026-07-15, per `docs/phase-4-completion.md`, and both documents' own Status fields have been updated accordingly.

---

# Authority Hierarchy

Per `docs/documentation-governance-framework.md` §1a (Documentation Authority Order), which this freeze defers to rather than restates:

```text
implementation-rules.md
        ↓
documentation-governance-framework.md
        ↓
CLAUDE.md
        ↓
implementation-playbook.md
        ↓
Architecture documents (Level 2 -- this freeze's Scope)
        ↓
Schema documents (Level 3)
        ↓
architecture-decisions.md (ADRs)
        ↓
Implementation
```

If any document within this freeze's Scope conflicts with a higher document in this order, the higher document governs, and the conflict must be resolved through the Conflict Resolution Process (`docs/documentation-governance-framework.md` §7) — not silently by whichever engineer notices it first.

---

# No Architectural Changes Without ADR

```text
Once ratified, no table, schema, role, service boundary,
domain boundary, or authorization rule described in the four
Scope documents may change without:

  1. A Proposal
  2. Architecture Review
  3. A recorded ADR (docs/architecture-decisions.md)
  4. A Documentation Update to the affected document(s)
  5. Only then, Implementation
```

This is not a new rule — it is the Architecture Change Lifecycle already defined in `docs/documentation-governance-framework.md` §5a, restated here as binding on the application architecture specifically.

---

# Architecture Change Lifecycle

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

Reference: `docs/documentation-governance-framework.md` §5a. This freeze does not define a separate lifecycle for application architecture — it uses the one already approved for the whole project.

---

# Implementation Rules

Per `docs/implementation-playbook.md`, binding on all Phase 5 implementation from this freeze forward:

```text
Consume the api schema exclusively

No new business logic without an approved ADR

Never bypass RLS or expose service_role to a client

Never silently work around ADR-013, ADR-014, or ADR-015

Every change is exercised end-to-end, not just type-checked
```

---

# Approved Module Structure

Per `docs/backend-architecture.md`'s Folder Structure and `docs/service-architecture.md`'s category placement, frozen as the Repository Scaffolding target once this document is ratified:

```text
backend/
├── app/
│   ├── api/
│   ├── auth/            (Infrastructure)
│   ├── domains/          (Domain Models -- types/entities only)
│   │   ├── identity/
│   │   ├── campaign/
│   │   ├── discovery/
│   │   ├── protection/
│   │   ├── intelligence/
│   │   ├── analytics/
│   │   ├── governance/
│   │   ├── notification/
│   │   ├── payment/
│   │   └── ai/
│   ├── services/         (Domain Services -- workflow logic)
│   │   ├── campaign/    (Application)
│   │   ├── payment/     (Application)
│   │   ├── notification/(Application)
│   │   ├── ai/          (Application)
│   │   ├── identity/    (Domain)
│   │   ├── discovery/   (Domain)
│   │   ├── protection/  (Domain)
│   │   ├── intelligence/(Domain)
│   │   ├── analytics/   (Domain)
│   │   └── governance/  (Domain)
│   ├── repositories/
│   ├── middleware/
│   ├── permissions/
│   ├── events/
│   ├── jobs/
│   ├── notifications/
│   ├── integrations/
│   ├── storage/         (Infrastructure)
│   ├── ai/               (Python/FastAPI -- ADR-016, separate app)
│   ├── config/
│   ├── utils/
│   ├── (dashboards)/     (Frontend, docs/frontend-architecture.md)
│   │   ├── layout.tsx    (Dashboard Layout / Navigation Strategy)
│   │   ├── admin/
│   │   ├── creator/      (includes page-local data.ts reader)
│   │   ├── community/
│   │   └── analytics/
│   └── components/       (Frontend, shared presentation-only UI)
├── tests/
├── scripts/
└── docs/
```

`app/domains/` holds Domain Models (per-domain types/entities/contracts, no logic); `app/services/` holds Domain Services (the workflow logic that operates on those types), categorized per `docs/service-architecture.md`. `app/ai/` (Python/FastAPI, per `ADR-016`) is a separate deployable application, not a subdirectory sharing the Next.js runtime — its presence in this tree marks where its integration contract lives, not where its own code lives. `app/(dashboards)/` and `app/components/` (Phase 5 Step 13, per `docs/frontend-architecture.md`, LOCKED 2026-07-16) are Next.js App Router presentation directories -- the former a route group (no URL segment of its own), the latter reusable, presentation-only components.

Beyond `domains/` (added by an earlier refinement), `app/(dashboards)/` and `app/components/` (added by this refinement, per `docs/frontend-architecture.md`), and the language exception noted for `app/ai/`, no directory is added here beyond what `docs/backend-architecture.md` already specifies.

---

# Security Requirements

```text
service_role never issued to, stored in, or reachable from
a client (docs/authentication-architecture.md)

RLS enforced without exception on every business-schema
table (already true, docs/database-implementation-complete.md)

PUBLIC execute revoked on every api schema function and
procedure (already true, Migration 008 Security Review)

No dynamic SQL, no direct business-schema access from
application code
```

---

# Review Process

```text
This document becomes ACTIVE / LOCKED only when:

  1. docs/backend-architecture.md and
     docs/implementation-playbook.md have themselves been
     reviewed and moved from DRAFT to an approved status by
     the Founder / Chief Architect, and

  2. The Founder / Chief Architect has reviewed this document
     itself and confirmed the frozen decisions above are
     complete and correct.

Both conditions are now met: docs/phase-4-completion.md
records Founder Approval as GRANTED on 2026-07-15, after the
Pre-Approval Architecture Consistency Pass resolved the
backend stack, phase-numbering, and domains/ folder
inconsistencies. This document's Status is LOCKED accordingly,
and Repository Scaffolding (Phase 5 Step 1) may now proceed.
```

---

# Success Criteria

This freeze is complete when:

```text
All four Scope documents exist and are internally
  consistent with each other                 -- done, this review
Frozen decisions are enumerated              -- done, above
Authority hierarchy is defined (by reference to
  documentation-governance-framework.md)      -- done, above
Approved module structure is defined          -- done, above
Security requirements are restated            -- done, above
Founder / Chief Architect ratification obtained -- GRANTED,
  2026-07-15 (docs/phase-4-completion.md)
```
