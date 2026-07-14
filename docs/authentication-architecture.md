# Authentication Architecture

Status:
LOCKED

Phase:
Phase 4

Hierarchy Level:
Level 2 — Architecture

---

# Purpose

This document defines how PCGH authenticates users, establishes sessions, and resolves roles for authorization.

It does not define a new identity system. Identity, roles, and the authorization boundary are already implemented in the database layer (`001_create_identity_schema.sql`, `docs/identity-schema.md`). This document defines how the backend and frontend connect to what already exists — it does not redefine it.

---

# Authentication Responsibilities

Per `docs/backend-architecture.md`'s Authentication Service module:

```text
login

logout

session validation

JWT handling

Supabase authentication

role resolution
```

The backend owns these six responsibilities and nothing more. Business rules, wallet operations, campaign logic, and reputation scoring are out of scope here and remain owned by their respective services and, ultimately, the database.

---

# Authentication Flow

```text
Client (browser / mobile)
        │
        ▼
Supabase Auth
(sign-up / sign-in / sign-out / session refresh)
        │
        ▼
Supabase session (JWT)
        │
        ▼
Backend receives request with session
        │
        ▼
identity.current_user_id()
(resolve auth.uid() -> identity.users.id)
        │
        ▼
identity.user_roles / identity.is_admin()
(resolve role membership, live)
        │
        ▼
Request proceeds to the API schema
        │
        ▼
Row Level Security
(final authorization boundary, always)
```

---

# Supabase Authentication

Supabase Auth is the platform's sole identity provider. `auth.users` (Supabase-managed) is the sole source of authentication credentials.

PCGH does not implement its own credential storage, password hashing, or session-signing logic. The backend calls Supabase Auth's SDK/API for sign-up, sign-in, sign-out, and session refresh; it does not reimplement any of this.

`identity.users.auth_user_id` links a platform profile to its Supabase Auth identity — this relationship already exists (migration 001). Authentication produces a Supabase session; resolving *who that is on the platform* means looking up `identity.users` by `auth_user_id`, exactly as `identity.current_user_id()` already does:

```sql
select id from identity.users where auth_user_id = auth.uid();
```

The backend calls this same resolution path (or the equivalent already-established RLS-safe pattern) rather than reimplementing an equivalent lookup that could silently diverge from it.

---

# JWT Validation

The Supabase-issued JWT is validated server-side using Supabase's own verification (its signature, issuer, and expiry are Supabase's responsibility, not a custom implementation here).

The JWT identifies *who is asking* (via `auth.uid()`). It is not a role-authority source: role membership is never read from JWT claims. It is only ever read live from `identity.user_roles` at the time of the check, via `identity.is_admin()` and the underlying RLS policies.

---

# Session Management

- Session issuance, refresh, and expiry are handled by Supabase Auth's existing session mechanism. The backend does not implement custom token signing or custom expiry logic.
- The frontend holds the Supabase session client-side (per Supabase's standard Next.js integration pattern) and forwards it on requests to the backend.
- The backend validates the session via Supabase's server-side verification, then resolves identity via `identity.current_user_id()` for any subsequent database interaction. It does not trust a client-supplied user id for anything security-relevant.

---

# Authorization Model

Row Level Security, already enforced on every business-schema table (001-009), is the platform's actual authorization boundary — not the backend.

Backend-layer authentication and role checks exist for user experience (routing, UI gating, clear error messages) and defense in depth. They are not a substitute for RLS and must never be relied upon as the only check standing between a request and the database.

Concretely: if a backend check has a bug and lets an unauthorized request through, RLS must still block it at the database. This is already true today and this document does not weaken it.

The Supabase `service_role` key bypasses RLS entirely and is not tied to any individual user. It is for trusted backend automation only and must never be issued to, stored in, or reachable from a browser or mobile client — the same assumption already underlying every `auth.uid() is null` check in `008_create_api_schema.sql`'s `SECURITY DEFINER` routines.

---

# Role Resolution

`identity.user_roles` is the single source of truth for `member` / `creator` / `admin` roles (`docs/identity-schema.md`, "Allowed Roles"). A user may hold more than one role simultaneously (a creator who is also a member) — this is already the approved design and must not be flattened into a single-role assumption anywhere in the application layer.

`identity.is_admin()` (already implemented, `SECURITY DEFINER`, migration 001) is the canonical admin check used throughout every existing migration and the API schema. The backend calls this same function — via the API layer, per `docs/backend-architecture.md`'s "API Schema First" principle — rather than reimplementing role-checking logic in TypeScript that could drift out of sync with it.

No new role beyond `member`, `creator`, `admin` is introduced by this document. `docs/analytics-schema.md`'s "Future Community Managers" role and `ADR-013`'s creator-protection-visibility question both remain open and unresolved — authentication architecture does not decide them.

---

# Permission Resolution

PCGH does not maintain a separate permissions table or a precomputed permission cache. "Permission" in this architecture is not a distinct concept from role resolution plus RLS:

```text
Permission = (resolved identity, resolved roles)
             evaluated live against the RLS policy or
             SECURITY DEFINER check governing the specific
             table, view, function, or procedure being accessed
```

There is no application-layer permission list to keep in sync with the database — the database's RLS policies and `SECURITY DEFINER` authorization checks are the only permission source, evaluated fresh on every request. Introducing a separate permissions table or cache would create exactly the "two sources of truth" risk `docs/backend-architecture.md`'s "Single Source of Truth" principle and `docs/phase-4-kickoff.md`'s equivalent principle both warn against, and is out of scope here.

---

# Authentication Components

Conceptual components only — no implementation is created by this document:

```text
Supabase client wrapper
    -- thin wrapper around the Supabase SDK for
       sign-up / sign-in / sign-out / session refresh

Session resolver
    -- server-side helper that validates the incoming
       Supabase session and calls identity.current_user_id()

Role resolver
    -- server-side helper that calls identity.is_admin()
       and reads identity.user_roles for the resolved user

Auth middleware entry point
    -- the single place incoming requests pass through
       before reaching a controller, per
       docs/backend-architecture.md's "Thin API Layer"
       principle (authentication is a controller
       responsibility, never business logic)
```

---

# Directory Structure

Illustrative only, consistent with `docs/backend-architecture.md`'s top-level `backend/app/auth/` — not created by this document:

```text
backend/app/auth/
├── supabase-client (wrapper)
├── session (resolver)
├── roles (resolver)
└── middleware (entry point)
```

Internal contents of this directory are an implementation concern for the Repository Scaffolding step, once this document is approved — not defined further here.

---

# Security Principles

```text
service_role is never issued to, stored in, or reachable
from a browser or mobile client

All session validation happens server-side; the backend
never trusts a client-asserted identity or role

Every authenticated request reaches the database as
`authenticated` (or `anon`), never as `service_role`,
so RLS applies exactly as already implemented in 001-009

Failed authentication fails closed (deny by default)

Role checks in application code are advisory (UX);
RLS and SECURITY DEFINER checks are authoritative
```

---

# Error Handling

Authentication errors follow `docs/backend-architecture.md`'s general Error Handling principles, applied specifically to this domain:

```text
Invalid credentials -> deterministic, generic failure
(never reveal whether the email or the password was wrong)

Expired or invalid session -> require re-authentication

Insufficient role for a requested action -> a clear,
user-facing authorization error, without exposing which
RLS policy or internal check produced it
```

Internal implementation details (table names, policy names, function names) must never be exposed to clients in any authentication-related error.

---

# Dependencies

```text
Supabase Auth (auth.users)

identity.users, identity.user_roles (001)

identity.current_user_id(), identity.is_admin() (001)

008_create_api_schema.sql
(the API layer every authenticated request ultimately reaches)
```

---

# Future Extensions

Not approved, not implemented, and not assumed by any part of this document:

```text
OAuth / social login providers

Multi-factor authentication

Password policy and reset-flow specifics beyond
Supabase Auth's default behavior

Rate limiting / brute-force protection at the
authentication endpoint
```

Any of the above is a Proposal under the Architecture Change Lifecycle (`docs/documentation-governance-framework.md` §5a) when actually needed — not a default assumed here.

---

# RLS Relationship

Row Level Security is not a downstream consequence of authentication — it is the actual authorization system. Authentication's job ends at producing a resolved identity (`identity.current_user_id()`) and resolved roles (`identity.is_admin()` / `identity.user_roles`); everything after that point is governed by the RLS policies and `SECURITY DEFINER` checks already locked in migrations 001-009.

This document introduces no new RLS policy and modifies none. Where a feature appears to need broader or different data access than current RLS allows, that is an open architecture question (e.g. `ADR-013`, `ADR-014`) — not something this document, or any authentication-layer code built from it, may resolve unilaterally.

---

# Architecture Diagram

```text
                Web / Mobile Clients
                         │
                         ▼
                 Frontend (Next.js)
                         │
                         ▼
                Supabase Auth (session)
                         │
                         ▼
              Backend Auth Middleware
       (session validation, identity + role resolution)
                         │
                         ▼
                 Backend API Layer
                         │
                         ▼
                  API Schema (Supabase)
                         │
                         ▼
              Business Schemas (001-009)
                (Row Level Security, always)
```

---

# Implementation Rules

Per `docs/implementation-playbook.md`, restated here for this domain specifically:

```text
Never expose the service_role key to client-side code

Never bypass RLS from authentication or authorization code

Never assume a single role per user

Never introduce a new role, permission table, or
permission cache without an approved ADR

Never trust client-supplied identity or role claims
for any security-relevant decision
```

---

# Success Criteria

This architecture is ready for implementation when:

```text
Authentication flow is documented          -- done, above
Role resolution is documented              -- done, above
Permission resolution is documented        -- done, above
Security principles are documented         -- done, above
RLS relationship is documented             -- done, above
Reviewed and approved by Founder / Chief Architect
```

Only after that final review may the Authentication Service be implemented.
