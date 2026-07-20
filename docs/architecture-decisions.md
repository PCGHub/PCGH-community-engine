# PCGH Architecture Decisions

## Status

LOCKED entries only. This log records decisions that have already been approved and locked in the corresponding schema or architecture documents. It does not introduce new decisions.

---

# Purpose

This document is the running record of approved architectural decisions for the PCGH Community Engine. Each entry states the decision, why it was made, and which document is the authoritative source.

---

# ADR 001 — Multi-Schema Database Architecture

**Decision:** PCGH uses a multi-schema Supabase/PostgreSQL database, with one schema per business domain rather than a single flat schema.

**Approved schemas:** identity, economy, discovery, protection, intelligence, analytics, governance.

**Source:** docs/phase-2-step-1-database-architecture.md, docs/phase-2-roadmap.md

---

# ADR 002 — Migration Numbering and Sequence

**Decision:** One migration per schema, applied in dependency order: 001 identity, 002 economy, 003 discovery, 004 protection, 005 intelligence, 006 analytics, 007 governance. Migrations are never modified once created; changes are always new migrations.

**Source:** docs/phase-2-roadmap.md (schema sequence: identity, economy, discovery, protection, intelligence, analytics, governance), CLAUDE.md (Migration Rules)

---

# ADR 003 — Intelligence Badge Model: Unified Catalog

**Decision:** Badges are modeled as a single reusable catalog (`intelligence.badges`) plus a single award table (`intelligence.user_badges`), scoped to the user rather than to a role. This replaced an earlier per-role split (`creator_badges` / `community_badges`).

**Rationale:** Badges belong to users, not roles — one user acting as both creator and member should not require duplicate badge records across separate tables.

**Source:** docs/intelligence-schema.md

---

# ADR 004 — Achievement History as a Permanent Recognition Log

**Decision:** `intelligence.achievement_history` is an append-only, permanent record of reputation milestones, badge awards, achievements, and recognition events. No history record is ever updated or deleted.

**Source:** docs/intelligence-schema.md

---

# ADR 005 — Governance Schema Approved as a Core Schema

**Decision:** Governance (`governance.feature_flags`, `system_settings`, `governance_rules`, `admin_overrides`, `platform_experiments`, `ai_controls`) is an approved, locked schema controlling platform evolution, feature management, and AI activation.

**Source:** docs/governance-schema.md, docs/phase-2-roadmap.md, docs/phase-2-step-1-database-architecture.md

---

# ADR 006 — AI and Feature Flags Are Centrally Governed

**Decision:** Feature flags and AI control toggles are owned exclusively by `governance.feature_flags` and `governance.ai_controls`. Other schemas must reference these tables rather than declaring their own local flags.

**Source:** docs/governance-schema.md, docs/analytics-schema.md (Future Features)

---

# ADR 007 — Analytics Schema: Design Locked, Implementation Deferred

**Decision:** The Analytics Schema (`member_analytics`, `community_analytics`, `creator_analytics`, `platform_analytics`, `analytics_events`, `analytics_reports`) is architecturally locked. Its migration is intentionally deferred until after Governance.

**Source:** docs/analytics-schema.md, IMPLEMENTATION_STATUS.md

---

# ADR 008 — Analytics Is a Rollup Layer, Not a Source of Truth

**Decision:** Analytics tables are derived aggregates. Upstream schemas remain the record of truth: `member_analytics` from `discovery.member_assignments`; `community_analytics` from `discovery.community_assignments` and `protection.community_performance_history`; `creator_analytics` from `economy.campaigns` and `discovery.discovery_opportunities`. Analytics does not own reputation or badge scoring — that remains with Intelligence.

**Source:** docs/analytics-schema.md (Analytics Relationships)

---

# ADR 009 — Analytics Tables Back the API Schema's Materialized Views

**Decision:** `creator_analytics`, `community_analytics`, and `platform_analytics` are the intended persistence layer behind the API Schema's future materialized view candidates (`creator_statistics_mv`, `community_statistics_mv`, `daily_platform_statistics_mv`). Materialized views are an implementation optimization only and never replace the Analytics Schema as the authoritative reporting layer.

**Source:** docs/analytics-schema.md, docs/api-schema.md

---

# ADR 010 — Community-Level Analytics Access Control

**Decision:** `analytics.community_analytics` access is role-restricted: administrators may view all community analytics; creators may view analytics only for communities participating in their own campaigns; members have no direct access; a future Community Manager role may view analytics for communities they manage.

**Rationale:** Consistent with the Protection Schema's philosophy of not exposing community-wide performance data to ordinary members.

**Source:** docs/analytics-schema.md (RLS Philosophy)

---

# ADR 011 — Platform-Wide Timestamp Convention

**Decision:** Every table has `id UUID PRIMARY KEY` and a `created_at` timestamp; UUIDs are used everywhere, never `SERIAL`; foreign keys always reference UUID columns.

**Source:** CLAUDE.md (Database Rules), applied across all locked schema documents

---

# ADR 012 — Row Level Security Is Mandatory and Schema-Owned

**Decision:** Every schema owns its own RLS policies. RLS is always enabled, follows least privilege, and is never disabled. Sensitive or aggregate cross-user tables (e.g. Protection Schema history tables, Analytics platform-wide tables) are restricted to administrators rather than exposed to members or creators.

**Source:** CLAUDE.md (Security), docs/protection-schema.md (RLS Philosophy), docs/analytics-schema.md (RLS Philosophy)

---

# ADR 016 — AI Service Is a Separate Python/FastAPI Application

**Decision:** The PCGH application backend is Next.js + TypeScript + Supabase (per `CLAUDE.md`'s `Backend` section), with one documented exception: the AI Service is implemented as a separate, independently deployed Python + FastAPI application. It shares no runtime, process, or codebase with the Next.js backend, and integrates with the rest of the system only through a defined internal API contract — never through shared in-process code, a shared ORM, or direct access to the same database connection pool. It consumes the `api` schema for any data access like every other service, and remains bound by the same RLS and `service_role` rules; being a different language grants no exemption from the security model. It implements orchestration only — AI-assisted decision-making features remain deferred pending ADR approval regardless of which language hosts the orchestration code.

**Rationale:** Python's AI/ML ecosystem is the practical choice for AI orchestration work; isolating it as its own service preserves the Next.js/TypeScript mandate for the rest of the backend and contains the blast radius of introducing a second language.

**Source:** Founder direction (Phase 5 planning session), `docs/backend-architecture.md` ("Application Stack," "AI Service"), `docs/service-architecture.md` ("AI Services")

---

# ADR 017 — Complete Credit Lifecycle

**Decision:** ADR-017 governs the full credit lifecycle, not only Flutterwave purchase-crediting: Wallet Provisioning → Funding/Credit → Ledger → Available Balance → Campaign Allocation → Spending → Release/Refund/Adjustment → Reconciliation.

**Wallet provisioning:** A wallet is provisioned exactly once, when a user first acquires creator financial capability (atomic with `api.grant_role('creator', ...)` where practical, idempotent via `insert ... on conflict (user_id) do nothing`). Once created, the wallet and its ledger history are permanent financial records, independent of any later role change — revoking the `creator` role never deletes or invalidates a wallet or its transactions.

**Funding, for the Phase 7 controlled MVP:** admin-controlled manual credit grants (`api.grant_credits()`, `transaction_type = 'adjustment'`, no schema change) — explicitly a controlled validation mechanism, not the final public payment architecture. Flutterwave integration remains a separate, later decision.

**Phase 7 campaign charging model, stated explicitly and permanently:** the entire `credits_budget` becomes consumed when a campaign is successfully activated for its first distribution. `credits_budget` is the maximum credits committed to that campaign's activation. Before activation, `credits_spent = 0`; after successful first activation, `credits_spent = credits_budget`. **This is a whole-budget-per-activation model — Phase 7 does not implement per-engagement, per-community, or incremental credit consumption, and rotation never generates an additional charge.** This is an intentional, controlled-MVP economic rule, not an implementation shortcut, and must not later be silently reinterpreted as granular/metered consumption — any future move to incremental or per-engagement charging requires its own ADR amendment before implementation.

**Financial-state invariants:**
- `economy.credit_wallets.balance` — actually-spendable balance right now; never reflects soft holds for undistributed drafts.
- `economy.campaigns.credits_budget` — a fixed plan at creation time, not itself a financial event.
- `economy.campaigns.credits_spent` — a derived, denormalized cache, synchronized with the real ledger write in the same transaction as the debit. Not the source of truth for idempotency.
- A `transaction_type = 'campaign'` row in `economy.credit_transactions` — the authoritative, immutable record that a specific amount was debited for a specific campaign. `balance` and `credits_spent` are both reconstructible by summing these records.

**Campaign creation — concurrency:** `api.create_campaign()` locks the creator's wallet row (`SELECT ... FOR UPDATE`) before computing committed budget (`SUM(credits_budget - credits_spent)` across that creator's own `draft`/`scheduled` campaigns) and validating available balance, all before inserting the new campaign row, all in one transaction. Application-layer availability checks alone are insufficient and are not the control mechanism.

**Campaign activation — idempotency, tightened:** `api.activate_campaign()` first locks the campaign row (`SELECT ... FROM economy.campaigns WHERE id = p_campaign_id FOR UPDATE`) and inspects the authoritative ledger state directly — it does not rely on catching a `unique_violation` as its primary control flow. If a committed `'campaign'`-type ledger transaction already exists for that campaign, it returns the defined idempotent already-activated result. Any *unexpected* uniqueness violation or an inconsistent financial state (e.g., a ledger entry without a matching `credits_spent` update) must fail loudly, never be silently converted into a success. Formal invariant: **a committed `'campaign'`-type ledger entry for campaign X may exist if and only if campaign X completed its first activation transaction successfully.** This holds because the wallet debit, ledger insertion, `credits_spent` update, and the nested call to `distribute_campaign()` all occur in one database transaction — partial committed activation state is impossible by construction, not by convention.

**Canonical lock ordering, permanent:** activation locks the **campaign row, then the creator wallet row** (in that order). Creation locks only the creator wallet row. Any future financial procedure touching both objects must follow this same ordering, to bound deadlock risk, unless an approved architecture amendment states otherwise.

**Transactional boundary:** `api.activate_campaign()`'s debit and its nested `CALL api.distribute_campaign(...)` execute in one atomic transaction. `distribute_campaign()` (frozen, EWP-002-approved) contains no internal transaction control, so if it raises for any reason, the entire transaction — including the wallet debit — rolls back. No modification to the frozen `distribute_campaign()` procedure is required or permitted by this decision.

**Activation remains admin-mediated for the Phase 7 controlled MVP:** a creator self-service-creates a `draft` campaign (already permitted by `campaigns_insert_own` RLS); an admin triggers `activate_campaign()`, consistent with `distribute_campaign()`'s existing, unmodified admin-only check. Creator self-activation is explicitly deferred and requires its own future architecture decision — this ADR does not reopen or weaken `distribute_campaign()`'s authorization check.

**Release/refund/adjustment, reconciliation:** an undistributed, cancelled draft has zero ledger footprint and needs no refund. A distributed-then-cancelled campaign has already legitimately consumed its budget under the whole-budget model above; a future admin-triggered `'refund'`-type transaction remains fully representable by the existing ledger design without further schema change, but is not built as part of Phase 7's minimum loop.

**Schema impact:** this decision requires **one minimal, additive schema mechanism** — a partial unique index:
```sql
create unique index if not exists credit_transactions_campaign_activation_uidx
  on economy.credit_transactions (reference)
  where transaction_type = 'campaign';
```
with `reference = campaign_id::text` by convention. No new table and no new column on `economy.campaigns` or `economy.credit_wallets` is required. This ADR is not "zero schema change" — it is one additive index, added via a new forward-only migration, never modifying migrations 001–009.

**Source:** Phase 7 Pre-Charter Architecture Resolution and the Phase 7 Readiness & LIVE Gap Analysis (this engagement); direct inspection of `economy.campaigns`, `economy.credit_wallets`, `economy.credit_transactions`, and the full body of `api.distribute_campaign()` (migration 008); Founder/Chief Architect decisions across this review. Supersedes and expands the original ADR-017 proposal (Phase 5 Step 12 Founder review, 2026-07-16).

---

# ADR 018 — Identity Provisioning Mechanism

**Decision:** A forward-only migration adds `identity.handle_new_auth_user()` (`SECURITY DEFINER`, `search_path` pinned to `identity, pg_temp`, mirroring `identity.current_user_id()`'s existing convention) and an `AFTER INSERT` trigger on `auth.users`, provisioning a matching `identity.users` row and a default `'member'`-only `identity.user_roles` row in the same transaction as signup.

- `user_code` is system-generated, immutable, and internal-only — never user-facing.
- `username` is a user-facing identity, chosen at signup and supplied through validated Supabase Auth signup metadata — never derived from the user's email address.
- **Username authority rule:** a frontend username-availability check may exist for UX responsiveness, but it is advisory only. It never substitutes for the database's own unique constraint and the provisioning transaction's collision handling, which remain the sole final authority on username uniqueness and must correctly and safely handle two signups racing past a frontend check simultaneously.
- Provisioning is idempotent (`insert ... on conflict (auth_user_id) do nothing`).
- On a `username` collision, the trigger fails the signup rather than silently mutating the chosen username; the caller must re-prompt with a different username. Any other failure is also allowed to abort the transaction.
- **Invariant, permanent:** there must never be a successfully authenticated PCGH user without a corresponding `identity.users` record — signup fails atomically if identity provisioning fails, rather than producing an orphaned `auth.users` row.
- Role default is `'member'` only, never `'creator'`.

**Rationale:** Closes a genuine architectural gap — no mechanism previously connected Supabase-managed `auth.users` to PCGH-owned `identity.users`, despite the relationship being named in migration 001's own header comment.

**Source:** Phase 7 Pre-Charter Architecture Resolution and the Phase 7 Readiness & LIVE Gap Analysis (this engagement); Founder/Chief Architect decision, 2026-07-18.

---

# Document Status

```text
Document:
docs/architecture-decisions.md

Approved ADRs:
15

Pending ADR Proposals:
3

Status:
LOCKED
```

---

# Pending ADR Proposals

## ADR-013 — Creator Protection Visibility

**Status:**
PROPOSED

**Summary:**
Determine whether creators should have visibility into their own cooldown and rotation status without exposing internal protection mechanisms.

---

## ADR-014 — Public Reputation Leaderboards

**Status:**
PROPOSED

**Summary:**
Determine whether reputation leaderboards should expose limited public ranking information while preserving private reputation metrics.

---

## ADR-015 — Reputation & Trust Scoring Model

**Status:**
PROPOSED

**Summary:**
Define the official reputation, trust, consistency, and amplification scoring model for the PCGH platform.
