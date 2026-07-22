# PCGH Community Engine

# Implementation Status

---

## Phase 1 — Platform Architecture

Status: ✅ COMPLETE

- Vision
- Business Model
- Architecture
- System Flow
- Repository Structure

---

## Phase 2 — Physical Database Design

Status: ✅ COMPLETE

- Identity Schema
- Economy Schema
- Discovery Schema
- Protection Schema
- Intelligence Schema
- Analytics Schema
- Governance Schema

---

## Phase 3 — Implementation

Status: ✅ COMPLETE

### Foundation

- [x] Repository Created
- [x] Documentation Complete
- [x] CLAUDE.md
- [x] Claude Configuration
- [x] First Migration

---

### Identity Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS
- [x] Seed Data (not applicable — docs/seed-data.md documents roles only, no seeded rows)

---

### Economy Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS
- [x] Seed Data (not applicable — no credit_packages table in the approved Economy Schema)

---

### Discovery Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS

---

### Protection Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS

---

### Intelligence Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS

---

### Analytics Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS

---

### Governance Schema

- [x] SQL Migration
- [x] Constraints
- [x] Indexes
- [x] RLS

---

### API Schema

- [x] Architecture Documented
- [x] SQL Migration (Views, Functions, Stored Procedures) — `supabase/migrations/008_create_api_schema.sql`, reviewed section-by-section (Views/Functions/Procedures/Security)

---

### Seed Data

- [x] Architecture Documented
- [x] SQL Migration — `supabase/migrations/009_create_seed_data.sql`

---

## Phase 4 — Application Architecture

Status: ✅ COMPLETE

- [x] Backend Architecture (`docs/backend-architecture.md`)
- [x] Authentication Architecture (`docs/authentication-architecture.md`)
- [x] Service Architecture (`docs/service-architecture.md`)
- [x] Domain Architecture (`docs/domain-architecture.md`)
- [x] Application Architecture Freeze (`docs/application-architecture-freeze.md`)
- [x] Phase 5 Roadmap (`docs/phase-5-roadmap.md`, renamed from Phase 4 Roadmap)
- [x] Implementation Playbook (`docs/implementation-playbook.md`)
- [x] ADR-016 (AI Service stack exception: Python/FastAPI)
- [x] Founder Approval — 2026-07-15 (`docs/phase-4-completion.md`)

---

## Phase 5 — Application Implementation

Status: 🔒 FROZEN — v0.5.0 (Founder Acceptance, 2026-07-17)

All 15 roadmap steps complete, each gated by typecheck, build, (from Step 14) test, an Architecture Compliance Review, a Security Review, and Founder approval. Subsequently hardened through a Chief Architect Final Acceptance Audit and a focused evidence-based technical-debt review, then frozen as a permanent architectural baseline:

- [x] Step 1 — Repository Scaffold
- [x] Step 2 — Core Infrastructure
- [x] Step 3 — Authentication
- [x] Step 4 — Identity (Profile Read Infrastructure)
- [x] Step 5 — Governance
- [x] Step 6 — Campaigns
- [x] Step 7 — Discovery
- [x] Step 8 — Protection
- [x] Step 9 — Intelligence
- [x] Step 10 — Analytics
- [x] Step 11 — Notifications
- [x] Step 12 — Payments (read/orchestration scope; Flutterwave credit-purchase crediting deferred to ADR-017)
- [x] Step 13 — Frontend Integration (`docs/frontend-architecture.md` created and LOCKED before dashboard implementation resumed)
- [x] Step 14 — Testing (Jest suite: 15 suites / 39 tests passing; one static security test; live-DB verification and performance testing deferred, no live environment)
- [x] Step 15 — Deployment Preparation (CI pipeline, observability wiring — fully wired into every critical mutating operation as the final Phase 5 task — rollback plan; live production provisioning not executed — no hosting credentials/authorization)

See `docs/phase-5-completion.md` for the full Founder Acceptance Report and its freeze-record addendum (final score, version, commit hash, and both approval sign-offs).

**Conditions attached to the original "APPROVED WITH CONDITIONS" decision (2026-07-16), now resolved:**

1. This document synchronized with actual Phase 4/5 completion — satisfied 2026-07-16.
2. The four open ADRs (013, 014, 015, 017) given a resolution timeline — carried forward explicitly as Known Future Work (Phase 6), not silently dropped. *(Historical count as of the 2026-07-16 Phase 5 decision. ADR-017 was subsequently resolved and ACCEPTED on 2026-07-18, per `docs/architecture-decisions.md` — see the Project Status block above for the current, authoritative open-ADR count of 3.)*

**Freeze-specific resolution:** TD-003 (observability unwired) was resolved as the final Phase 5 implementation task; TD-004 was reclassified as intentional future infrastructure, not debt, per an evidence-based review against the approved roadmap. TD-001 and TD-002 remain as accepted, documented debt — see `docs/technical-debt.md`.

---

## Phase 6 — API Foundation & Application Layer

Status: 🔒 FROZEN — v0.6.0 (Founder/Chief Architect Final Acceptance, 2026-07-18)

See `docs/phase-6-charter.md` for full detail (Mission, Principles, Scope, EWP Approval Log). Summary only, not duplicated here:

- [x] EWP-001 — API Foundation (shared foundation: `app/api/_lib/`, `/api/v1/health`) — delivered 2026-07-17
- [x] EWP-002 — Campaign API (8 routes) — **Founder/Chief Architect APPROVED AND FROZEN, 2026-07-18**. TD-005 (error classification) resolved; TD-006 opened as legitimate, unfixed open debt.
- [x] EWP-003 — Discovery API (2 read-only routes) — **Founder/Chief Architect APPROVED AND FROZEN, 2026-07-18**. Zero changes to `discovery-service.ts`, zero new `_lib` code. TD-006 out of scope (structurally unreachable — Discovery has no mutating service function).
- [x] EWP-004 — Protection API (1 read-only route) — **Founder/Chief Architect APPROVED AND FROZEN, 2026-07-18**. Zero changes to `protection-service.ts`, zero new `_lib` code. Self-only RLS preserved exactly (no admin bypass); ADR-013 not decided, weakened, or bypassed (no cooldown field exposed).
- [x] EWP-005 — Analytics API (3 read-only routes) — **Founder/Chief Architect APPROVED AND FROZEN, 2026-07-18**. Zero changes to `analytics-service.ts`, zero new `_lib` code, zero mutations. ADR-008 preserved. `/platform`'s 404 is an intentional non-disclosure semantic. An RLS-citation error in the original proposal (which policy governs `community_dashboard_view`'s visibility) was caught and corrected during implementation by tracing the actual migration SQL — no code change was required; corrected wording is authoritative in `docs/api-specification.md` Section 2.
- [x] EWP-006 — Intelligence Badge Catalog API (1 read-only route) — **Founder/Chief Architect APPROVED AND FROZEN, 2026-07-18**. Deliberately named/scoped as the Badge Catalog only, not "the Intelligence API." Zero changes to `intelligence-service.ts`, zero new `_lib` code. `getReputationLeaderboard`, `awardBadge`/`revokeBadge`, the reputation recalculation functions, and `createPerformanceBonus` remain unexposed; ADR-014/ADR-015 verified unaffected by direct RLS inspection.
- [x] Phase 6 API Foundation Coverage Review — completed and accepted, 2026-07-18. Produced a formal **Deferred Capability Register** (`docs/phase-6-charter.md`) covering Governance, Payment, Notification, Protection cooldown, and the remaining Intelligence capabilities, classified as Intentionally Deferred / Internal-Only / Requires ADR-Architecture Decision / Structurally Absent. Also found Identity Domain profile exposure was omitted from the charter's original Scope by drafting oversight — ruled **IN SCOPE** by Founder/Chief Architect decision. Also produced a documentation-only ADR-015 labeling correction (Analytics' reputation-derived fields now explicitly noted as provisional, matching Intelligence's `isProvisional` treatment — no behavior, RLS, or response-shape change).
- [x] EWP-007 — Identity Profile API (1 self-only route) — **Founder/Chief Architect APPROVED AND FROZEN, 2026-07-18**. Identity resolved from `auth.session.userId` only, never a request parameter; no `[userId]` route. During scope refinement, an architectural naming gap was found and stopped-on rather than worked around: neither `getCreatorProfile()` nor `getMemberProfile()` accurately names an arbitrary caller (roles are independently assignable, migration 001) — resolved by a separately-approved, additive `getUserProfile()` function in `profile-service.ts` (a scoped, approved exception to Phase 5's freeze). No profile-update capability added.
- [x] Phase 6 Chief Architect Final Acceptance Audit — **10/10, zero Major/Critical findings, Founder-approved 2026-07-18.** One cosmetic documentation correction made during the audit. Full report in `docs/phase-6-completion.md`.

See `docs/phase-6-completion.md` for the full Founder Acceptance Report and Freeze Record (final score, version, commit hash, and both approval sign-offs).

---

## Phase 7 — Production Readiness & Controlled MVP Enablement

Status: ✅ CHARTER APPROVED — LOCKED, 2026-07-18. **No EWP implementation has begun.**

See `docs/phase-7-charter.md` for full detail (Mission, Scope, 15 EWPs EWP-008–EWP-022, Migration Strategy, Testing Architecture, Controlled-MVP-vs-Public-LIVE gate definitions). Summary only, not duplicated here:

- [x] Phase 7 Readiness & LIVE Gap Analysis — complete, 2026-07-18.
- [x] Pre-Charter Architecture Resolution — complete, 2026-07-18.
- [x] ADR-018 (Identity Provisioning Mechanism) — ACCEPTED, 2026-07-18.
- [x] ADR-017 (Complete Credit Lifecycle) — ACCEPTED, 2026-07-18.
- [x] `docs/phase-7-charter.md` — drafted, validated, revised, and **APPROVED/LOCKED**, 2026-07-18. 12 of 15 EWPs classified Controlled-MVP-blocking (EWP-011/018/021 non-blocking but Production-Readiness-blocking).
- [x] EWP-008 (Local/CI Live-Database Test Infrastructure) — **COMPLETE / VERIFIED / FROZEN, 2026-07-20 (10/10 Founder/Chief Architect acceptance).** Docker Desktop + WSL2 installed; `supabase start` executed against a genuinely fresh stack (slow, network-retried image pulls, all succeeded); `supabase/config.toml` reviewed and trimmed (Realtime/Storage/Edge Functions/Supabase-platform-Analytics disabled — nothing in PCGH's architecture uses them; `schemas = ["api", "identity"]` corrected from the generated default). `npm run test:live` passes 7/7 against the real stack, proving migrations 001–008 applied (`identity.users` directly + one representative `api.*` view per business schema); migration 009 proven by clean stack boot. Ordinary `npm test` independently re-verified unaffected: 37 suites / 131 tests, identical to the pre-EWP-008 baseline. `lint`/`typecheck`/`build` all clean; `service_role` confirmed absent from the built bundle. One real bug found and fixed during verification: `@supabase/supabase-js` always constructs a `RealtimeClient` requiring a WebSocket implementation Node 20 lacks natively — fixed via a new `ws` devDependency, used only inside `tests/helpers/live-supabase-client.ts`. Dependency security audit performed; `next@14.2.35` residual CVEs logged as **TD-007** (binding gate before unrestricted Public Production LIVE, staging-access-control condition attached for EWP-009) — not fixed via `--force` or major upgrade, per explicit constraint. Committed as two commits (`587b623` governance, `0b47d58` implementation) and pushed to `origin/main`. GitHub Actions run **29750451378** on `0b47d58` independently confirmed `conclusion: success` on both the `backend` job (Lint/Typecheck/Test/Build) and the new `live-tests` job (Start local Supabase stack/Export local stack keys/Run live tests/Stop local Supabase stack), verified via the GitHub REST API at every job/step level.
- [x] EWP-009 (Real Supabase Staging Environment) — **COMPLETE / VERIFIED, 2026-07-21.** Project `PCGH Community Engine - Staging` (ref `lnoradklbsxetytlhjcf`, org PCHub's org, region Europe) provisioned by the Founder; migrations 001–009 applied via `supabase link` + `supabase db push`, independently verified via `supabase migration list` (Local/Remote match on every version) and four direct read-only inventories (schemas, 41 base tables, 11 `api` views, 18 `api`/`identity` routines) cross-checked row-for-row against migrations 001–008 — exact match, zero missing/extra objects. RLS verified live: all 41 business-schema tables `rowsecurity = true`; all 81 RLS policies cross-checked exactly against migrations 001–008; all table/view grants (`authenticated`/`service_role` only, zero unexpected `anon` grants) cross-checked exactly across all 8 schemas. Routine-level `EXECUTE` privileges (`has_function_privilege()`/`proacl`) surfaced a real finding: `identity.current_user_id()`, `identity.is_admin()`, and `identity.set_updated_at()` carried an undocumented implicit `PUBLIC` execute grant (migration 001 never explicitly governed it, unlike `api`'s deliberate ACL) — remediated via a new forward-only **migration 010** (`010_secure_identity_routine_execute.sql`, revokes `PUBLIC`, explicitly re-grants `authenticated`/`service_role` only), logged and resolved as **TD-008**; validated locally (11/11 `tests/live/` passing, including new `identity-routine-privileges.test.ts`) before remote application, then independently re-verified on staging post-apply (`anon_execute = false`, explicit ACL present, all 15 `api` routines unchanged). Data API exposed schemas corrected from the hosted default (`public, graphql_public`) to `api, identity`, deferred until `api`/`identity` existed remotely, then verified against the actual grant architecture (zero `public`-schema dependencies found across all 9 migrations) before applying. Seed migration 009 validated on staging: all five seeded tables' row counts and literal values (including `DEFAULT_COOLDOWN_DAYS = 14`, a hard runtime dependency of `api.rotate_campaign()`) cross-checked exactly against the migration's own literals. One staging admin identity bootstrapped via a documented, one-time exception (Supabase Dashboard "Add user" for `auth.users`, a single transactional SQL block with pre/post verification for the matching `identity.users`/`identity.user_roles` rows — never a raw `auth.users` insert, never pre-implementing ADR-018/EWP-010's automatic provisioning) — independently verified via a read-only query returning exactly one correctly-linked row. TD-007's staging-reachability gate assessed: EWP-009's scope deploys no Next.js code anywhere, so that item's risk is not triggered by this EWP (recorded in `docs/technical-debt.md`).
- [x] EWP-010 (Automatic Identity Provisioning, ADR-018) — **COMPLETE / VERIFIED, 2026-07-22.** New forward-only `011_provision_identity_from_auth_signup.sql`: `identity.handle_new_auth_user()` (`SECURITY DEFINER`, `search_path` pinned, zero `EXECUTE` grant to any of `anon`/`authenticated`/`service_role` — trigger-only by design, applying Migration 010's own lesson from creation rather than repeating its more cautious re-grant pattern) plus an `AFTER INSERT` trigger `on_auth_user_created` on `auth.users`. Closes the gap confirmed live during scoping: `backend/app/auth/session.ts`'s `resolveSession()` depended on an `identity.users` row nothing previously created, meaning no real signup could authenticate against the existing Authentication Service before this EWP. Validated locally first (`supabase db reset` applying 001–011 fresh; `lint`/`typecheck`/`npm test` 37/131/`build` all clean; `npm run test:live` 15/15 passing, including 4 new tests: successful provisioning, a self-contained username-collision atomicity test, missing-username atomicity, and a role-escalation-attempt rejection test) before remote application. Deployed to staging via Founder-executed `db push`; independently re-verified: migration history 001–011 match, the deployed function definition and trigger binding are identical to the reviewed source (modulo Postgres's own formatting normalization), and `EXECUTE` privileges confirmed `anon=false/authenticated=false/service_role=false` for the new function, with the other three `identity` routines unchanged from their post-Migration-010 state. A real, controlled staging signup (Admin API, `email_confirm: true`) empirically proved the full provisioning chain: exactly one `identity.users` row (`user_code` matching the approved `USR-[0-9A-F]{16}` format — 64 bits of the row's own UUID, explicitly documented as probabilistically unique and backstopped by the column's `UNIQUE` constraint, never claimed as mathematically guaranteed), username/email preserved exactly, and exactly one `identity.user_roles` row (`'member'`, hardcoded — no client-metadata path can ever produce `'creator'`/`'admin'`). `status` correctly followed its schema default (`'pending'`), since Migration 011 never sets it. `email_verified` returned `false` despite the Admin API response showing `email_confirmed_at` populated — traced and confirmed as a real instance of the already-disclosed **TD-009** signup-time-only limitation (Supabase's Auth service writes the confirmation timestamp as a step distinct from the base `auth.users` insert, which this `AFTER INSERT`-only trigger never observes), not a new defect, and deliberately not fixed inside EWP-010 since ADR-018 describes only an `AFTER INSERT` trigger. Test-user cleanup surfaced and corrected a real verification-process mistake: an initial `DELETE` without `RETURNING` produced an ambiguous "Success. No rows returned" message mistakenly read as proof of deletion, when the row had not actually been removed (its `NO ACTION` foreign key was still blocking Auth-side deletion as a direct result); corrected via `DELETE ... RETURNING` plus an independent count check, positively confirming zero residual rows before the Auth-side test user was removed through Supabase's supported deletion mechanism. Final residue confirmed zero across `identity.users`, `identity.user_roles`, and `auth.users`.

---

## Project Status

**Current Phase:** Phase 7 — Production Readiness & Controlled MVP Enablement — 🚧 CHARTERED, NOT YET IMPLEMENTED (charter locked 2026-07-18)

**Current Task:** EWP-010 COMPLETE / VERIFIED, 2026-07-22 (ADR-018's automatic identity provisioning deployed to staging and independently verified end-to-end via a real controlled signup). Holding per explicit Founder instruction — EWP-011 requires its own separate Founder/Chief Architect scope proposal and approval before any signup/login UI work begins. No UI, no business logic beyond identity provisioning itself, has been implemented for Phase 7.

**Overall Progress:** 100% (Phase 1-6, frozen); Phase 7 charter approved/locked, EWP-008/EWP-009/EWP-010 COMPLETE/VERIFIED. 3 ADRs (013, 014, 015) remain open; TD-001/TD-002/TD-006/TD-007 remain open (TD-007 — `next@14.2.35` CVEs with no non-major remediation, logged during EWP-008's dependency audit — see `docs/technical-debt.md`; binding resolution gate before unrestricted Public Production LIVE; assessed during EWP-009 as not yet triggered, since no Next.js deployment exists). TD-008 (undocumented implicit routine-execute grant, discovered and resolved during EWP-009 via migration 010) is RESOLVED. TD-009 (`identity.users.email_verified` is signup-time-only, discovered during EWP-010 via migration 011) remains OPEN — explicitly disclosed, currently inert (no code reads this field), deferred pending its own ADR treatment. Per `docs/phase-7-charter.md`'s informational (non-governance-metric) estimate: ~45–50% toward unrestricted public LIVE at the current state, projected ~60–65% after Controlled-MVP-blocking Phase 7 work, ~70–75% after all Phase 7 work including Production-Readiness items.

**Last Updated:** 2026-07-22

---

# Overall Progress

## Phase 1 — Platform Architecture

████████████████████ 100% ✅ COMPLETE

## Phase 2 — Physical Database Design

████████████████████ 100% ✅ COMPLETE

## Phase 3 — Implementation

████████████████████ 100% ✅ COMPLETE

## Phase 4 — Application Architecture

████████████████████ 100% ✅ COMPLETE

## Phase 5 — Application Implementation

████████████████████ 100% 🔒 FROZEN — v0.5.0

## Phase 6 — API Foundation & Application Layer

████████████████████ 100% 🔒 FROZEN — v0.6.0

## Phase 7 — Production Readiness & Controlled MVP Enablement

░░░░░░░░░░░░░░░░░░░░   0% ✅ CHARTER APPROVED/LOCKED — implementation not started
