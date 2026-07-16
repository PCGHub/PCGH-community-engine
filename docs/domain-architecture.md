# Domain Architecture

Status:
LOCKED

Phase:
Phase 4

Hierarchy Level:
Level 2 — Architecture

---

# Purpose

This document defines the application-layer domain boundaries for the PCGH Community Engine: which schema(s) each domain owns, which `api.*` objects it uses, and how domains may communicate. A "domain" here is an application-layer grouping around already-locked database schema(s) (`docs/*-schema.md`, migrations 001-009) — this document does not introduce a new data model, table, or business rule.

---

# Domain Philosophy

Per `docs/backend-architecture.md`'s "Modular Architecture" principle: each domain owns its own service boundary, and no domain may directly manipulate another domain's internal implementation. A domain's implementation lives inside its named Domain Service (`docs/service-architecture.md`); its data lives inside its owned schema(s); its external surface is the subset of the `api` schema it's responsible for.

---

# Domain Boundaries

```text
A domain's boundary is exactly:
  1. The business schema(s) it owns
  2. The api.* views/functions/procedures built on those
     schema(s)

Cross-domain communication happens only through:
  1. The api schema, or
  2. A documented Application Service that coordinates
     multiple domains (Campaign Service, per
     docs/service-architecture.md)

No domain queries another domain's schema directly.
No domain calls another domain's internal service methods.
```

---

# Authentication Domain

```text
Owns:      No business schema (infrastructure, not a
           business domain)
Uses:      auth.users (Supabase-managed),
           identity.current_user_id(), identity.is_admin()
Defined in: docs/authentication-architecture.md (full detail)
```

Authentication is listed as a domain heading here because every other domain depends on it for identity resolution, but it owns no business data of its own — see `docs/service-architecture.md`'s "Infrastructure Services" for why it is categorized as infrastructure rather than a business domain.

---

# Identity Domain

```text
Owns:   identity schema (users, user_roles, creator_circles,
        creator_circle_members, member_communities,
        member_community_members, community_member_history)
Uses:   api.creator_dashboard_view, api.member_dashboard_view
        (profile fields only -- see API Ownership below)
Source: docs/identity-schema.md
```

Root dependency for every other domain — `identity.users.id` is referenced, directly or transitively, by every other schema.

---

# Campaign Domain

```text
Owns:   economy.campaigns, economy.campaign_asset,
        economy.campaign_distributions
Uses:   api.campaign_summary_view, api.distribute_campaign(),
        api.rotate_campaign(), api.close_campaign(),
        api.archive_campaign(), api.restore_campaign(),
        api.calculate_campaign_performance()
Source: docs/economy-schema.md (campaign-related tables only
        -- see Payment Domain below for the rest of Economy)
```

`docs/backend-architecture.md` names a "Campaign Service," not an "Economy Service" — the Economy schema's five tables split across two domains: campaign-related tables here, wallet/ledger tables under Payment Domain. This split is implied by `docs/backend-architecture.md`'s existing module descriptions (Campaign Service: "campaign creation, scheduling, publishing... Uses: Economy"; Payment Service: "wallet operations, bonus payouts") and is made explicit here rather than left ambiguous.

---

# Discovery Domain

```text
Owns:   discovery schema (discovery_opportunities,
        community_assignments, member_assignments,
        assignment_history)
Uses:   api.discovery_summary_view
Source: docs/discovery-schema.md
```

Populated by Campaign Domain's `api.distribute_campaign()`, not by Discovery Domain itself — Discovery Domain reads and reports on discovery data; it does not initiate distribution.

---

# Protection Domain

```text
Owns:   protection schema (rotation_history,
        community_cooldowns, member_cooldowns,
        community_exclusions, community_performance_history)
Uses:   api.creator_protection_view, api.is_creator_on_cooldown()
Source: docs/protection-schema.md
```

`api.is_creator_on_cooldown()` is invoked internally by Campaign Domain's `api.distribute_campaign()` (centralized cooldown enforcement, per the Migration 008 Stored Procedure review) — Protection Domain does not re-check cooldowns independently in application code. `api.creator_protection_view` deliberately omits cooldown status for creators, pending `ADR-013` — this is not to be worked around at the domain level.

---

# Intelligence Domain

```text
Owns:   intelligence schema (member_reputation,
        creator_reputation, community_reputation, badges,
        user_badges, performance_bonus,
        performance_bonus_members, achievement_history)
Uses:   api.badges_view, api.reputation_leaderboard_view,
        api.award_badge(), api.revoke_badge(),
        api.calculate_member_reputation(),
        api.calculate_creator_reputation(),
        api.calculate_community_reputation(),
        api.create_performance_bonus() (shared with Payment
        Domain -- see API Ownership below)
Source: docs/intelligence-schema.md
```

Reputation-scoring formulas exposed here are documented placeholders pending `ADR-015` — Intelligence Domain must not present them as final in user-facing copy. `api.reputation_leaderboard_view` is admin-only in practice pending `ADR-014`.

---

# Analytics Domain

```text
Owns:   analytics schema (member_analytics,
        community_analytics, creator_analytics,
        platform_analytics, analytics_events,
        analytics_reports)
Uses:   api.platform_statistics_view (administrator-only),
        api.community_dashboard_view
Source: docs/analytics-schema.md
```

Analytics is a rollup layer, not a source of truth (`ADR-008`) — Analytics Domain does not recompute business facts already owned by another domain; it aggregates them.

---

# Governance Domain

```text
Owns:   governance schema (feature_flags, system_settings,
        governance_rules, admin_overrides,
        platform_experiments, ai_controls)
Uses:   api.is_feature_enabled(), api.platform_configuration_view
        (administrator-only)
Source: docs/governance-schema.md
```

Every other domain calls `api.is_feature_enabled()` to check feature gating — Governance Domain is the single owner of that check; no other domain maintains its own copy of feature-flag state.

---

# Notification Domain

```text
Owns:   No business schema (consumes events from other domains)
Uses:   analytics.analytics_events (read, for event-driven
        triggers), future email/push provider integrations
Source: docs/backend-architecture.md (Notification Service),
        Event Flow
```

Notification Domain has no dedicated business schema in the current locked architecture — its data is the event stream produced by other domains, plus (in the future) its own delivery/template records, which are explicitly listed as future seed data / future architecture (`docs/seed-data.md` "Future Seed Data": Notification Templates, Email Templates) and are not created by this document.

---

# Payment Domain

```text
Owns:   economy.credit_wallets, economy.credit_transactions
Uses:   api.wallet_summary_view, api.calculate_wallet_balance(),
        api.create_performance_bonus() (shared with
        Intelligence Domain -- see API Ownership below)
Source: docs/economy-schema.md (wallet/ledger tables only --
        see Campaign Domain above for the rest of Economy)
```

Wallet crediting for performance bonuses is conditional on a recipient already having a wallet (member wallets are not part of the approved Economy Schema) — this is already-implemented behavior in `api.create_performance_bonus()`, not a new rule introduced here.

---

# AI Domain

```text
Owns:   No business schema (orchestration only)
Uses:   governance.ai_controls, governance.feature_flags
        (via api.is_feature_enabled())
Source: docs/backend-architecture.md (AI Service),
        docs/service-architecture.md ("AI Services")
```

AI Domain's Phase 5 scope is orchestration and integration plumbing only. AI-assisted decision-making features (campaign distribution, predictive analytics, autonomous moderation, recommendation engines) remain explicitly out of scope pending ADR approval, per `docs/phase-4-kickoff.md`. This is why AI Domain has no dedicated implementation step of its own in `docs/phase-5-roadmap.md` — its infrastructure is scaffolded alongside Storage under Step 2 (Core Infrastructure), and feature-level work does not begin until a specific capability is proposed and approved.

---

# Domain Communication Rules

```text
Domains communicate only through:
  1. The api schema
  2. A documented Application Service (Campaign, Payment,
     Notification, AI) that explicitly coordinates more
     than one domain

No domain reads another domain's schema directly.
No domain calls another domain's internal repository or
service methods directly.
```

---

# Repositories

A "repository," per `docs/backend-architecture.md`'s Folder Structure (`app/repositories/`), is a thin wrapper around calling `api.*` views/functions/procedures for a given domain — it is not a data-access layer that constructs its own SQL or queries a business schema directly. Per "API Schema First," the API schema already is the data-access contract; a repository's only job is to type and shape calls into it for its domain's services.

---

# Services

Each domain's implementation lives inside its named service, categorized per `docs/service-architecture.md` (Domain Service for Identity/Discovery/Protection/Intelligence/Analytics/Governance; Application Service for Campaign/Payment/Notification/AI; Infrastructure Service for Authentication/Storage). This document defines *what* each domain owns; `docs/service-architecture.md` defines *how* services are categorized, bounded, and governed.

---

# Events

Per `docs/backend-architecture.md`'s Event Flow, attributed to the domain that produces each event:

```text
Campaign Domain     -> Campaign Created, Campaign Distributed
Discovery Domain    -> Assignments Generated, Discovery Activity
Analytics Domain    -> Analytics Updated (consumes the above)
Notification Domain -> Notifications Sent (consumes the above)
Intelligence Domain  -> Badge Awarded, Bonus Granted
                        (recorded to achievement_history)
Governance/Intelligence -> Audit Recorded
                        (achievement_history / analytics_events)
```

---

# API Ownership

```text
Identity Domain
  api.creator_dashboard_view (profile fields)
  api.member_dashboard_view (profile fields)

Campaign Domain
  api.campaign_summary_view
  api.distribute_campaign(), api.rotate_campaign(),
  api.close_campaign(), api.archive_campaign(),
  api.restore_campaign(), api.calculate_campaign_performance()

Discovery Domain
  api.discovery_summary_view

Protection Domain
  api.creator_protection_view, api.is_creator_on_cooldown()

Intelligence Domain
  api.badges_view, api.reputation_leaderboard_view,
  api.award_badge(), api.revoke_badge(),
  api.calculate_member_reputation(),
  api.calculate_creator_reputation(),
  api.calculate_community_reputation()

Payment Domain
  api.wallet_summary_view, api.calculate_wallet_balance()

Shared (Intelligence + Payment)
  api.create_performance_bonus()

Governance Domain
  api.is_feature_enabled(), api.platform_configuration_view

Analytics Domain
  api.platform_statistics_view, api.community_dashboard_view

Cross-domain (no single owner -- aggregates multiple domains)
  api.creator_dashboard_view (wallet + reputation + campaigns
    + badges: Identity, Payment, Campaign, Intelligence)
  api.member_dashboard_view (reputation + assignments + bonuses
    + badges: Identity, Discovery, Intelligence)
```

Where a view spans multiple domains, it is owned jointly by the domains it aggregates — no single domain may unilaterally change its shape without the others' awareness, per the Architecture Change Lifecycle.

---

# Implementation Rules

Per `docs/implementation-playbook.md` and `docs/service-architecture.md`, restated here:

```text
No domain queries another domain's schema directly

No domain invents a new role, table, or API object without
an approved ADR

Cooldown, reputation, and leaderboard visibility remain
exactly as currently implemented pending ADR-013/014/015 --
no domain-level workaround
```

---

# Success Criteria

This architecture is ready for implementation when:

```text
Every domain's schema ownership is defined      -- done, above
Every domain's api.* usage is defined            -- done, above
The Economy schema split (Campaign/Payment) is explicit -- done
Storage and AI's non-domain status is explained  -- done, above
Domain communication rules are defined           -- done, above
Reviewed and approved by Founder / Chief Architect
```
