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

# Document Status

```text
Document:
docs/architecture-decisions.md

Approved ADRs:
13

Pending ADR Proposals:
4

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

---

## ADR-017 — Payment Credit Pipeline

**Status:**
PROPOSED

**Summary:**
Define the `api.*` procedure(s) needed to credit `economy.credit_wallets` (and record the corresponding `economy.credit_transactions` entry) from a verified Flutterwave purchase, so Phase 5 Step 12's deferred "Flutterwave integration for credit purchase" deliverable can be implemented without an application-layer write to `economy.credit_wallets`/`economy.credit_transactions`.

**Source:** Phase 5 Step 12 (Payments) Founder review, 2026-07-16; `docs/phase-5-roadmap.md` Step 12's own Dependencies clause ("If Flutterwave-driven wallet crediting requires a new `api.*` procedure not yet built, that is an Architecture Change Lifecycle proposal, not an application-layer workaround").

**Note:** Originally requested as "ADR-016," but ADR-016 is already assigned (AI Service Is a Separate Python/FastAPI Application, approved during Phase 4). Numbered ADR-017 here to avoid a collision with the existing, approved decision.
