# PCGH Community Engine

# Phase 7 Charter

---

# Phase

**Phase 7 — Production Readiness & Controlled MVP Enablement**

---

# Status

✅ **APPROVED — LOCKED**, Founder/Chief Architect approval 2026-07-18. No EWP may begin implementation until a genuine architectural change requires an amendment to this charter, via the same Architecture Change Lifecycle governing every other Level 2 document. Note: this charter's LOCK authorizes Phase 7 to be scoped and its EWPs to be individually proposed — each EWP still requires its own separate Founder approval before implementation begins, exactly as every Phase 6 EWP was, per the "Founder approval gate: Yes" field on every EWP below. **This charter's approval is not an authorization to begin EWP-008.**

---

# Date

2026-07-18 (original draft); revised following Final Charter Validation; **locked** following Final Founder Decision, 2026-07-18

---

# Executive Summary

Phase 6 is frozen as a permanent architectural baseline (`docs/phase-6-completion.md`, v0.6.0, commit `08edc7c`). The Phase 7 Readiness & LIVE Gap Analysis found that the frozen API/data layer sits on top of a product journey no real user can complete: no mechanism provisions a PCGH identity from a Supabase Auth signup, no procedure creates a campaign, and no procedure ever moves a credit into or out of a wallet. A Pre-Charter Architecture Resolution produced two accepted ADRs — **ADR-018 (Identity Provisioning Mechanism)** and **ADR-017 (Complete Credit Lifecycle)**.

Phase 7 implements exactly what ADR-017 and ADR-018 decided, closes the campaign-creation gap, and proves — against real Supabase infrastructure, not mocks — that a controlled, admin-mediated user can complete the canonical PCGH loop end-to-end, including the member's participation action, not merely delivery to them.

---

# Revision History

```text
2026-07-18 -- Original draft.
2026-07-18 -- Final Charter Validation: corrected a real sequencing
  defect (staging positioned too late), split blocking/non-blocking
  EWPs, defined migration strategy, defined test-directory strategy,
  tightened the Controlled-MVP-vs-Production-LIVE boundary.
2026-07-18 -- Final Founder Decision, applied and LOCKED:
  - EWP for participation-action recording reclassified BLOCKING --
    Controlled MVP (was non-blocking).
  - Staging environment EWP moved to immediately after local/CI
    test infrastructure and before the first database implementation
    EWP (was positioned near the end of the sequence).
  - Migration strategy (3 migrations) formally APPROVED.
  - Transaction-ownership rule formally APPROVED.
  - Testing architecture APPROVED WITH ONE GOVERNANCE REQUIREMENT:
    a documented CI workflow is required for tests/live/ and
    tests/e2e/, and no EWP may be marked complete with a required
    live test merely existing but not run.
  - Controlled MVP / Public LIVE gate language finalized verbatim.
  - Completion percentages replaced with the Founder's specific
    figures (45-50% / 60-65% / 70-75%), informational only.
```

---

# Phase 7 Mission

Make the canonical PCGH core loop — signup through campaign distribution through member participation through analytics — executable end-to-end by a controlled, admin-mediated user against real infrastructure, without resolving ADR-013/014/015 and without expanding the frozen Phase 1–6 architecture beyond what ADR-017/ADR-018 already decided.

Architecture always precedes implementation, per `docs/engineering-principles.md` AGR-001. ADR-017 and ADR-018 are the approved architecture Phase 7 implements; nothing in Phase 7 may deviate from either without a new ADR amendment.

---

# Governing Documents

```text
docs/architecture-decisions.md — ADR-017 and ADR-018, both ACCEPTED
  2026-07-18; ADR-013/014/015 remain PROPOSED, not touched.
docs/engineering-principles.md — all 26 rules binding; QGR-006
  extended to the new test categories below; EPR-001 (Thin Service
  Principle) governs the Transaction-Ownership rule below.
docs/documentation-governance-framework.md — Architecture Change
  Lifecycle and Level precedence, unchanged; this charter is now
  registered as a Level 2 entry (see that document's own registry).
Phase 7 Readiness & LIVE Gap Analysis (2026-07-18) — evidence base.
IMPLEMENTATION_STATUS.md (current) — 15 approved ADRs, 3 pending.
docs/technical-debt.md — TD-001/TD-002/TD-006 unresolved, untouched.
```

---

# Work Package Numbering (EWP)

Continues the global sequence from Phase 6, spanning **EWP-008 through EWP-022** (15 EWPs). No EWP begins implementation until separately presented and approved, exactly as every Phase 6 EWP was. **This charter's LOCK is not an implementation authorization for any individual EWP.**

---

# Scope

## Required Before Controlled MVP Launch (Blocking)

```text
1.  Local/CI live-database testing infrastructure.
2.  A real Supabase staging project -- established immediately after
    (1) and before any database implementation EWP, per the Founder's
    explicit staging-dependency directive.
3.  Identity provisioning (ADR-018).
4.  Creator capability grant + wallet provisioning, atomic (ADR-017).
5.  Controlled funding (admin-manual credit grants).
6.  Campaign creation with wallet-row-locked concurrency enforcement.
7.  Atomic campaign activation: debit + ledger + credits_spent +
    initial distribution, one transaction, admin-mediated.
8.  Admin-mediated community assignment.
9.  Member participation-action recording -- BLOCKING, per the
    Founder's Final Decision: the controlled MVP must prove that a
    distributed campaign results in a real, recorded member action,
    not merely delivery.
10. Live end-to-end validation of the critical MVP journey.
11. Live RLS/security verification of the new surface.
12. A final controlled-MVP acceptance gate.
```

## Recommended, Non-Blocking for Controlled MVP (Should-Have / Blocking for Production Readiness)

```text
- Signup/login UI (the Controlled MVP proof may use a direct
  Supabase Auth API call; a real product needs a real UI before
  public use)
- Minimal admin operational UI (the Controlled MVP proof may use
  direct RPC calls; a real operator needs one before ongoing use)
- Deployment/runbook/rollback documentation for the new surface
```

## Deferred Post-MVP (Explicitly Out of Scope, Unchanged)

```text
- Flutterwave / any real payment provider integration
- Creator self-activation (distribute_campaign()'s frozen admin
  check is not reopened or weakened)
- Granular / per-engagement / per-community campaign charging
- Automatic refunds of any kind
- Public reputation leaderboards (ADR-014)
- A finalized reputation/trust scoring model (ADR-015)
- Creator-visible cooldown status (ADR-013)
- Self-service community joining
- External social-platform verification APIs, sophisticated
  anti-fraud systems, automatic engagement verification, rewards
  expansion, new gamification, or speculative task systems --
  explicitly excluded from EWP-017 (Participation-Action Recording)
  by the Founder's Final Decision; that EWP uses only the existing
  member_assignments lifecycle fields
- Any UI expansion beyond the named minimal surfaces
- AI orchestration or Clayme-related expansion of any kind
- Real production deployment (Phase 7 stands up staging only)
```

**ADR-013, ADR-014, and ADR-015 remain unresolved.** No EWP, in either classification above, touches cooldown status, leaderboard ranking, or reputation scoring in any way — re-confirmed at every validation pass.

---

# Critical End-to-End MVP Journey (Final, per Founder Decision)

```text
Signup
  -> Identity Provisioning
  -> Member
  -> Controlled Creator Enablement + Wallet Provisioning
  -> Controlled Funding
  -> Campaign Creation
  -> Credit Commitment Validation
  -> Admin Activation
  -> Atomic Debit + Ledger + Distribution
  -> Member Assignment
  -> Participation Action Recorded
  -> Analytics/Audit Verification
```

This exact sequence, executed once against real staging infrastructure with no mocked step and no deferred link, is what EWP-019 must complete and record.

---

# EWP Classification — Blocking vs. Non-Blocking (Final)

| EWP | Name | Controlled MVP | Production Readiness |
|---|---|---|---|
| 008 | Local/CI Live-Database Test Infrastructure | **BLOCKING** | BLOCKING |
| 009 | Real Supabase Staging Environment | **BLOCKING** | BLOCKING |
| 010 | Identity Provisioning Mechanism (ADR-018) | **BLOCKING** | BLOCKING |
| 011 | Signup/Login Onboarding UI | Non-blocking | **BLOCKING** |
| 012 | Creator Capability Grant + Wallet Provisioning (ADR-017) | **BLOCKING** | BLOCKING |
| 013 | Controlled Funding (Admin Credit Grant) | **BLOCKING** | BLOCKING |
| 014 | Campaign Creation + Concurrency Enforcement | **BLOCKING** | BLOCKING |
| 015 | Atomic Campaign Activation + Debit + Distribution | **BLOCKING** | BLOCKING |
| 016 | Admin-Mediated Community Assignment | **BLOCKING** | BLOCKING |
| 017 | Member Participation-Action Recording | **BLOCKING** *(reclassified this decision)* | BLOCKING |
| 018 | Minimal Admin Operational UI | Non-blocking | **BLOCKING** |
| 019 | End-to-End Integration Testing | **BLOCKING** | BLOCKING |
| 020 | Security & RLS Live Verification | **BLOCKING** | BLOCKING |
| 021 | Deployment/Runbook/Rollback Readiness | Non-blocking | **BLOCKING** |
| 022 | Final Controlled-MVP Acceptance Gate | **BLOCKING** | BLOCKING |

**12 of 15 EWPs are Controlled-MVP-blocking.** Only EWP-011, EWP-018, and EWP-021 remain non-blocking for the Controlled MVP proof itself, though all three are required before Production Readiness and are recommended to build regardless.

---

# Engineering Work Packages — Final, Dependency-Ordered

## EWP-008 — Local/CI Live-Database Test Infrastructure

**Objective:** A disposable, real (not mocked) Postgres/Supabase Auth/PostgREST stack (Supabase CLI) for fast per-EWP live-database testing.
**Dependencies:** None — first EWP.
**Tests:** The stack itself, proven by a smoke test (migrations apply, a trivial RPC call succeeds).
**Documentation sync:** `backend/docs/deployment.md`.
**Exit criteria:** `supabase start` (or equivalent) boots reliably in CI and locally; all Phase 7 migrations apply cleanly against it.
**Founder approval gate:** Yes.

## EWP-009 — Real Supabase Staging Environment

**Objective:** The persistent, shared, cloud staging project — moved to this position, immediately after local/CI infrastructure and before any database implementation EWP, per the Founder's explicit staging-dependency directive: no implementation EWP may claim completion on live tests that were never actually run against a real Supabase/PostgreSQL environment.
**Dependencies:** EWP-008.
**Scope:** One Supabase staging project; `api`/`identity` schemas exposed via Data API settings; environment variables populated; one manually-seeded admin identity.
**Tests:** N/A (infrastructure) — verified by successful migration application and a smoke query.
**Security/compliance:** `service_role` key confirmed staging-only, never client-exposed.
**Documentation sync:** `backend/docs/deployment.md`.
**Exit criteria:** Staging project live, schemas exposed, admin bootstrapped, ready to receive every subsequent EWP's migrations and live tests.
**Founder approval gate:** Yes — provisioning real infrastructure is a hard-to-reverse action affecting a real, shared system; explicit authorization required before this EWP executes.

## EWP-010 — Identity Provisioning Mechanism (ADR-018)

**Objective:** Implement ADR-018 exactly as accepted.
**Dependencies:** EWP-008, EWP-009.
**Scope:** Migration (identity-provisioning group, see Migration Strategy): `identity.handle_new_auth_user()` + `AFTER INSERT` trigger on `auth.users`. Idempotent. Fails the signup transaction on a `username` collision; fails on any other error. `user_code` system-generated internal; `username` from validated signup metadata, never derived from email. Default role `'member'` only.
**Tests:** `tests/live/` — idempotency, collision rejection, rollback-on-failure (no orphaned `auth.users` row), default-role assignment — **run against staging (EWP-009) before this EWP is approved complete, not deferred to a later EWP.**
**Security/compliance:** `SECURITY DEFINER`/`search_path` reviewed against `identity.current_user_id()`'s existing pattern.
**Documentation sync:** `IMPLEMENTATION_STATUS.md` EWP log entry.
**Exit criteria:** All `tests/live/` assertions pass against staging; a real Supabase Auth signup produces a correct `identity.users` + `identity.user_roles` row.
**Founder approval gate:** Yes.

## EWP-011 — Signup/Login Onboarding UI

**Objective:** Minimal UI to exercise EWP-010 for real. Non-blocking for Controlled MVP; recommended.
**Dependencies:** EWP-010.
**Scope:** Registration + login forms calling Supabase Auth directly; a client-side username-availability check, explicitly advisory only.
**Tests:** Component tests; one `tests/live/` test proving a real signup through this UI.
**Documentation sync:** `docs/frontend-architecture.md`.
**Exit criteria:** A real person can sign up and log in through the deployed staging UI.
**Founder approval gate:** Yes.

## EWP-012 — Creator Capability Grant + Wallet Provisioning (ADR-017)

**Objective:** Admin-mediated creator activation; ADR-017's permanent-wallet invariant.
**Dependencies:** EWP-010.
**Scope:** Migration (credit-lifecycle group): `api.grant_role()`/`api.revoke_role()`. Wallet creation atomic with `grant_role('creator', ...)`. Revocation never touches the wallet or ledger.
**Tests:** `tests/live/` — atomicity (grant + wallet succeed/fail together), revocation-preserves-wallet — run against staging before completion is claimed.
**Security/compliance:** Admin-only gate re-verified.
**Documentation sync:** `docs/api-specification.md`.
**Exit criteria:** An admin can grant/revoke creator capability; a wallet is created exactly once and survives revocation.
**Founder approval gate:** Yes.

## EWP-013 — Controlled Funding (Admin Credit Grant)

**Objective:** ADR-017's Phase 7 funding mechanism.
**Dependencies:** EWP-012.
**Scope:** `api.grant_credits(p_user_id, p_amount, p_reason)`, `transaction_type = 'adjustment'`. Documented as controlled-validation-only, not final payment architecture.
**Tests:** `tests/live/` — wallet/ledger arithmetic invariant, confirms this procedure never writes `transaction_type = 'campaign'` — run against staging before completion is claimed.
**Documentation sync:** `docs/api-specification.md`.
**Exit criteria:** An admin can fund a creator's wallet; the ledger is correct.
**Founder approval gate:** Yes.

## EWP-014 — Campaign Creation + Credit Commitment Concurrency Enforcement

**Objective:** `api.create_campaign()` per ADR-017's concurrency design.
**Dependencies:** EWP-012, EWP-013.
**Scope:** Migration (credit-lifecycle group): wallet-row `FOR UPDATE` lock, derived committed-budget computation, validation, campaign insert — one transaction. `campaign_code` generation scheme decided here.
**Tests:** `tests/live/` **concurrency tests** — two simultaneous `create_campaign()` calls for the same creator, asserting exactly one succeeds when combined budgets would overcommit — run against staging before completion is claimed.
**Security/compliance:** Confirm database locking, not application logic, is the actual control.
**Documentation sync:** `docs/api-specification.md`.
**Exit criteria:** Overcommitment is provably impossible under concurrent load.
**Founder approval gate:** Yes.

## EWP-015 — Atomic Campaign Activation + Ledger Debit + Distribution

**Objective:** `api.activate_campaign()` per ADR-017's tightened idempotency and transactional-boundary design.
**Dependencies:** EWP-014.
**Scope:** Migration (credit-lifecycle group): the approved partial unique index. Campaign-row lock, then wallet-row lock (canonical order). Authoritative ledger-state check before any write. Debit + ledger insert + `credits_spent` update + nested `CALL api.distribute_campaign(...)` — one transaction; the frozen procedure is called, never modified. Admin-mediated only.
**Tests:** `tests/live/` **transactional/concurrency tests** — two simultaneous activations on the same campaign (exactly one debits); a forced `distribute_campaign()` failure proving full rollback; a retry-after-success proving idempotent no-op — run against staging before completion is claimed.
**Security/compliance:** Admin-check-before-existence-check ordering re-verified; `distribute_campaign()` confirmed byte-for-byte unmodified (`git diff` against the Phase 6 freeze commit).
**Documentation sync:** `docs/api-specification.md`.
**Exit criteria:** Activation is provably atomic, provably idempotent, provably never charges without successful distribution.
**Founder approval gate:** Yes — highest-risk EWP in the phase; recommend maximum scrutiny.

## EWP-016 — Admin-Mediated Community Assignment

**Objective:** Operationalize the existing, unchanged admin-only membership model.
**Dependencies:** EWP-010.
**Scope:** Migration (community/participation group): `api.assign_member_to_community(p_user_id, p_community_id)` — thin wrapper around the already-permitted RLS insert. No self-service join.
**Tests:** `tests/live/` — self-service join remains impossible.
**Documentation sync:** `docs/api-specification.md`.
**Exit criteria:** An admin can assign a member; a member cannot self-assign.
**Founder approval gate:** Yes.

## EWP-017 — Member Participation-Action Recording

**Objective:** Prove the operational loop: campaign distributed → eligible member receives assignment → member performs/records the expected participation action → assignment lifecycle reflects it → analytics/audit can observe the result. **BLOCKING — Controlled MVP, per the Founder's Final Decision.**
**Dependencies:** EWP-015, EWP-016.
**Scope:** Migration (community/participation group): `api.record_assignment_action(p_assignment_id, p_action)`, self-scoped, setting the matching existing `discovery.member_assignments` timestamp column and `status` — **no new table, no new column, no external verification, no anti-fraud system, no gamification** — exactly the existing lifecycle fields, per the Founder's explicit minimality instruction.
**Tests:** `tests/live/` — a member cannot record an action against another member's assignment (RLS self-scope) — run against staging before completion is claimed.
**Security/compliance:** Self-scope RLS re-verified, not assumed.
**Documentation sync:** `docs/api-specification.md`.
**Exit criteria:** A member can mark their own assignment viewed/shared/saved; cannot touch anyone else's; the resulting state is queryable via existing Analytics/Discovery reads.
**Founder approval gate:** Yes.

## EWP-018 — Minimal Admin Operational UI

**Objective:** Tie EWP-012/013/015/016 into clickable admin actions. Non-blocking for Controlled MVP; recommended.
**Dependencies:** EWP-012, EWP-013, EWP-015, EWP-016.
**Scope:** One minimal admin screen exposing: grant/revoke creator, grant credits, activate a campaign, assign a member. Not a workflow system.
**Tests:** Component tests; one `tests/live/` test exercising each action through the UI.
**Documentation sync:** `docs/frontend-architecture.md`.
**Exit criteria:** An admin can perform every underlying action without direct database access.
**Founder approval gate:** Yes.

## EWP-019 — End-to-End Integration Testing of the Critical MVP Journey

**Objective:** Execute the Critical End-to-End MVP Journey (above), once, against staging, with no mocked and no deferred step.
**Dependencies:** EWP-009, EWP-010, EWP-012 through EWP-017 (every Controlled-MVP-blocking implementation EWP).
**Scope:** `tests/e2e/` — a scripted (or rigorously documented manual) walkthrough of every journey step, recorded with evidence at each step.
**Tests:** This EWP *is* the test.
**Documentation sync:** Results recorded toward the eventual `docs/phase-7-completion.md`.
**Exit criteria:** The full journey, including the member's participation action, completes with zero manual database intervention.
**Founder approval gate:** Yes.

## EWP-020 — Security & RLS Live Verification

**Objective:** Close the Phase-5-carried-forward live-RLS-validation risk for the new financial/identity surface.
**Dependencies:** EWP-009, EWP-010, EWP-012 through EWP-017.
**Scope:** Execute `tests/security/live-verification-queries.sql`, extended with: wallet-per-creator invariant, ledger arithmetic, the campaign-activation unique index actually preventing a double-debit at the database level, self-scope on participation-action recording.
**Tests:** The live SQL suite itself, run and its output recorded.
**Documentation sync:** `docs/technical-debt.md` — note the scope of what this closes (the new surface only, not the full Phase 1–6 surface).
**Exit criteria:** All live RLS assertions pass against staging.
**Founder approval gate:** Yes.

## EWP-021 — Deployment/Runbook/Rollback Readiness

**Objective:** Extend `backend/docs/deployment.md`'s rollback plan to cover the new migrations and procedures. Non-blocking for Controlled MVP; blocking for Production Readiness.
**Dependencies:** EWP-010, EWP-012 through EWP-017.
**Scope:** Document how to safely disable the `auth.users` trigger if needed; confirm CI green with new migrations; forward-only discipline restated (DSR-003, unchanged).
**Tests:** CI re-run, recorded.
**Documentation sync:** `backend/docs/deployment.md`.
**Exit criteria:** A documented, reviewed rollback path exists for every new piece of Phase 7 infrastructure.
**Founder approval gate:** Yes.

## EWP-022 — Final Controlled-MVP Acceptance Gate

**Objective:** A Chief-Architect-style final audit of the entire phase, mirroring the Phase 6 Final Acceptance Audit's rigor.
**Dependencies:** All prior EWPs (blocking ones mandatory; non-blocking ones assessed for whether they were built).
**Scope:** Independently re-verify every blocking EWP's exit criteria directly against the repository and staging; confirm zero out-of-scope items pulled in; confirm ADR-013/014/015 remain PROPOSED.
**Tests:** Full regression (all existing 37+ mocked suites, plus every `tests/live/` and `tests/e2e/` case) run fresh.
**Documentation sync:** `docs/phase-7-completion.md` (mirroring `docs/phase-6-completion.md`) — a deliverable of this EWP, not created by this charter.
**Exit criteria:** A findings-classified report with a final score, presented for Founder approval.
**Founder approval gate:** Yes — this is the phase-freeze decision itself.

---

# 1. Dependency Order (Final)

```text
EWP-008 (Local/CI Infra)
  --> EWP-009 (Staging Project) -- moved here per Founder directive;
        precedes every database implementation EWP
        --> EWP-010 (Identity Provisioning)
              --> EWP-011 (Signup UI) [non-blocking]
              --> EWP-012 (Creator Grant + Wallet, atomic)
                    --> EWP-013 (Controlled Funding)
                          --> EWP-014 (Campaign Creation)
                                --> EWP-015 (Activation + Debit + Distribution)
              --> EWP-016 (Community Assignment)
                    --> EWP-017 (Participation Action) [BLOCKING]
                          [depends on both EWP-015 and EWP-016]
              --> EWP-018 (Admin UI) [non-blocking; needs 012,013,015,016]

EWP-009, 010, 012-017 all complete, live-tested against staging
  --> EWP-019 (E2E Journey Test, including the participation-action step)
  --> EWP-020 (Security/RLS Live Verification)
  --> EWP-021 (Deployment/Runbook Readiness) [non-blocking, may run
       any time after 010, 012-017 are code-complete]
  --> EWP-022 (Final Acceptance Gate)
```

**Governance rule, binding:** no implementation EWP (010, 012–017) may be marked complete with a required `tests/live/` assertion merely written but not executed against real infrastructure (EWP-008 and/or EWP-009). A test file existing is not evidence of anything; a recorded, passing run against real Postgres is.

---

# 2. Migration Strategy — APPROVED

Three dependency-ordered, forward-only migrations, grouped by architectural concern, per this project's own precedent (migration 008's bundling of interrelated `api.*` objects vs. migrations 001–007's schema-boundary separation):

```text
Migration A -- Identity Provisioning (ADR-018)
  identity.handle_new_auth_user() + auth.users trigger. (EWP-010)

Migration B -- Complete Credit Lifecycle (ADR-017)
  api.grant_role()/revoke_role(), wallet-provisioning logic,
  api.grant_credits(), api.create_campaign(), the partial unique
  index, api.activate_campaign(). Kept together because they share
  one cohesive set of financial invariants and lock ordering.
  (EWP-012, 013, 014, 015)

Migration C -- Community & Participation Operations
  api.assign_member_to_community(), api.record_assignment_action().
  (EWP-016, 017)
```

No giant single Phase 7 migration; no fragmentation into one migration per procedure. Never modifies migrations 001–009, per DSR-003.

---

# 3. Transaction Ownership — APPROVED

Every database-owned invariant remains database-atomic. The TypeScript service/controller layer must never reproduce:

```text
locking
balance validation
ledger sequencing
provisioning sequences
activation orchestration
```

**Binding rule:** where an operation is defined as atomic (the five operations in the prior draft's Transaction-Boundary section — signup provisioning, creator+wallet grant, credit grant+ledger, campaign creation+commitment validation, activation+debit+ledger+distribution), the application layer invokes exactly one canonical database procedure as one operation — never more than one round-trip, never client-side re-implementation of locking or sequencing. Per EPR-001 (Thin Service Principle) and the precedent already set by `createPerformanceBonus()`'s single-RPC wrapper.

---

# 4. Testing Architecture — APPROVED WITH GOVERNANCE REQUIREMENT

```text
tests/unit/              existing -- isolated unit behavior, mocked,
                          unchanged meaning
tests/integration/api/   existing -- HTTP route lifecycle with
                          mocked dependencies, unchanged meaning;
                          nothing that isn't a real HTTP route test
                          belongs here
tests/security/          existing -- extended with new live RLS
                          assertions for the Phase 7 surface (EWP-020)
tests/live/               NEW -- real Supabase/PostgreSQL integration,
                          RLS, trigger, transaction, and concurrency
                          validation (EWP-010, 012-017's own tests)
tests/e2e/                NEW -- the single scripted critical-journey
                          walkthrough (EWP-019), staging-only
```

**Governance requirement, per Founder directive:** `tests/live/` and `tests/e2e/` may be excluded from the default local `npm test` run **only if** a dedicated, documented command exists (e.g. `npm run test:live`, `npm run test:e2e`) **and** a corresponding CI workflow actually runs it against real infrastructure — not merely a local convenience script nobody invokes. A test required by an EWP's exit criterion is satisfied only by a recorded, passing execution — never by the mere existence of a test file. QGR-006 (tests ship with the implementation they validate) is preserved and extended to both new categories.

---

# 5. Controlled MVP vs. Public Production LIVE — Final, Permanent Gate Definitions

**"Phase 7 PASS" / Controlled MVP Ready means:**
```text
architecture implemented
critical journey proven end-to-end
real staging environment validated
financial invariants proven
RLS/security verified
controlled/admin-mediated operation demonstrated
required documentation/runbooks synchronized
```

**It does not mean unrestricted public production launch is authorized.**

**Public Production LIVE requires a separate Founder Go-Live authorization**, issued only after the remaining production concerns (Section 6) are reviewed. "LIVE" and "Controlled MVP Ready" are never used interchangeably in any status communication about this phase.

---

# 6. Remaining Public-LIVE Work (Concrete, Not Percentage-Only)

```text
Production infrastructure/configuration (distinct from staging)
Production secrets management
Domain/DNS/SSL
Monitoring/alerting pointed at a real destination
Backup/recovery procedures
Production deployment/rollback validation (beyond Phase 7's staging-
  scoped runbook)
Load/performance validation at real expected scale
Payment/funding decision: Flutterwave or an approved alternative
Legal/privacy/terms/compliance readiness, where applicable -- named
  because it has not been addressed anywhere in this engagement
Remaining frontend/product UX required for real (non-admin-mediated)
  users
ADR-013/014/015 resolution, or an explicit continued-deferral decision
Creator self-service activation decision, if required for public scale
Operational support/admin procedures beyond Phase 7's minimal actions
```

---

# 7. Completion Estimate (Informational Only — Never a Governance Metric)

Per the Founder's Final Decision, these specific figures, with context, supersede any previously-computed range:

```text
Current state (frozen Phase 6 + pre-Phase-7 architecture resolution):
  ~45-50% toward unrestricted public LIVE.

After Controlled-MVP-blocking Phase 7 work is proven:
  ~60-65%.

After all Phase 7 work (Controlled-MVP + Production-Readiness items)
  is completed:
  ~70-75% toward unrestricted public LIVE.
```

**The remaining ~25–30% is production commercialization/operations work (Section 6), not missing core architecture.** These figures are not to be used for progress reporting in a way that inflates them, and are not encoded as a governance metric anywhere else in this documentation set.

---

# Controlled MVP Definition

MUST-HAVE = the 12 Controlled-MVP-blocking EWPs (Section "EWP Classification"). SHOULD-HAVE = the 3 non-blocking-but-recommended EWPs plus everything in Section 6. POST-LAUNCH = ADR-014, ADR-013, avatar upload, mobile, AI, load testing at scale, creator self-activation.

---

# Phase 7 Success Criteria

```text
ADR-017 and ADR-018 implemented exactly as accepted.
Every blocking EWP's exit criteria independently re-verified at
  EWP-022, not merely asserted.
The Critical End-to-End MVP Journey -- including the member
  participation-action step -- completes against real staging
  infrastructure with zero manual database intervention.
Zero out-of-scope items pulled in; ADR-013/014/015 remain PROPOSED.
Every EWP ships its own tests in the same work package, in the
  correct directory, actually executed against real infrastructure
  where required -- not merely present as a file.
service_role isolation and RLS-as-final-authority re-verified live
  for the entire new surface.
The Controlled-MVP-vs-Production-LIVE distinction is preserved in
  every status communication about this phase.
```

---

# Production-Readiness Exit Gate

Phase 7 is complete when EWP-022's final report is Founder-approved. This authorizes exactly what Section 5 states — Controlled MVP proof on real infrastructure — and nothing beyond it. Public Production LIVE remains a separate, later, explicitly-named decision requiring its own Founder Go-Live authorization.

---

# Document Status

```text
Document:
docs/phase-7-charter.md

Hierarchy Level:
Level 2 — Architecture

Status:
✅ APPROVED — LOCKED, Founder/Chief Architect approval 2026-07-18

Depends on:
ADR-017 (ACCEPTED), ADR-018 (ACCEPTED) -- docs/architecture-decisions.md

Registered:
docs/documentation-governance-framework.md, Level 2 entry

Last Updated:
2026-07-18
```
