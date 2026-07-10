# PCGH API Schema

## Schema

```text
api
```

## Status

LOCKED

## Phase

Phase 3 — Database API Layer

---

# Purpose

The API Schema provides a secure, reusable, and optimized database interface for the PCGH platform.

Unlike the core business schemas, the API Schema does not own business data.

Instead, it exposes database Views, SQL Functions, and Stored Procedures that simplify application development while protecting the underlying business schemas.

Every PCGH application should consume this API layer instead of querying business tables directly.

---

# Platform Architecture

```text
identity
        │
economy
        │
discovery
        │
protection
        │
intelligence
        │
governance
        │
───────────────
        │
        ▼
      api
        │
───────────────
        │
Frontend

Backend

Mobile

Admin Portal

AI Services
```

---

# API Philosophy

The API layer exists to:

• Simplify complex queries

• Centralize reusable business logic

• Improve reporting performance

• Provide a stable database interface

• Reduce duplicated SQL

• Support future platform expansion

Business data always remains inside its original schema.

The API layer never duplicates business data.

---

# Components

The API Schema contains three object types:

```text
Database Views

SQL Functions

Stored Procedures
```

---

# Database Views

Views provide optimized read-only datasets for applications.

Views never own data.

Views aggregate data from one or more business schemas.

---

## api.creator_dashboard_view

Provides:

- Creator profile
- Wallet summary
- Reputation
- Active campaigns
- Discovery statistics
- Performance statistics
- Earned badges

---

## api.creator_protection_view

Allows a creator to see their own protection status:

- Community
- Exclusion Status
- Cooldown Status
- Reason
- Expiration

Does not expose internal rotation logic.

---

## api.member_dashboard_view

Provides:

- Member profile
- Reputation
- Pending assignments
- Completed assignments
- Performance bonuses
- Earned badges

Member wallets are not part of the approved Economy Schema, so wallet information is not exposed here.

---

## api.community_dashboard_view

Provides:

- Community profile
- Reputation
- Members
- Active campaigns
- Engagement statistics
- Historical performance

---

## api.campaign_summary_view

Provides:

- Campaign
- Creator
- Budget
- Credits spent
- Communities reached
- Campaign status
- Performance metrics

---

## api.discovery_summary_view

Provides:

- Discovery opportunities
- Community assignments
- Member assignments
- Completion statistics
- Distribution analytics

---

## api.wallet_summary_view

Provides:

- Current balance
- Lifetime earned
- Lifetime spent
- Pending bonuses
- Available credits

---

## api.reputation_leaderboard_view

Provides:

- Creator rankings
- Member rankings
- Community rankings
- Reputation scores
- Badge totals

---

## api.badges_view

Exposes the badge catalog through the API layer, so applications do not need to query `intelligence.badges` directly.

---

## api.platform_statistics_view

Provides:

- Platform totals
- Campaign statistics
- Community statistics
- Credit statistics
- Reputation statistics
- Discovery statistics

---

## api.platform_configuration_view

Exposes platform configuration information for administrators:

- Feature Flags
- System Settings
- Governance Rules
- AI Controls

---

# SQL Functions

Functions centralize reusable business logic.

---

## calculate_member_reputation()

Recalculates a member's reputation score.

---

## calculate_creator_reputation()

Recalculates a creator's reputation score.

---

## calculate_community_reputation()

Recalculates a community's reputation score.

---

## calculate_campaign_performance()

Calculates campaign performance metrics.

---

## calculate_wallet_balance()

Returns a user's current wallet balance.

---

## is_creator_on_cooldown()

Returns TRUE when a creator is under an active distribution cooldown.

---

## is_feature_enabled(flag_name)

Returns whether a platform feature flag is currently enabled.

---

## award_badge()

Awards a badge to a user.

Automatically creates an achievement_history record.

---

## revoke_badge()

Removes a user's active badge.

Historical achievement records remain unchanged.

---

# Stored Procedures

Stored Procedures execute transactional platform operations.

---

## distribute_campaign()

Performs the full distribution workflow, in order:

```text
Campaign
      ↓
Discovery Opportunity
      ↓
Community Assignment
      ↓
Member Assignment
      ↓
Distribution
```

---

## rotate_campaign()

Performs creator rotation.

Updates Protection History.

---

## close_campaign()

Completes a campaign.

Calculates final statistics.

---

## archive_campaign()

Archives a campaign.

---

## restore_campaign()

Restores an archived campaign.

---

## create_performance_bonus()

The single transactional operation responsible for the complete performance bonus flow:

- Creates the append-only performance bonus record
- Credits the recipient's wallet
- Creates the corresponding credit transaction
- Records the operation in achievement_history where applicable

The Intelligence Schema uses append-only bonus records and does not implement a pending/approved lifecycle -- a bonus is created already approved, not transitioned through a status.

---

# Security Philosophy

Views inherit Row Level Security from their underlying tables.

Read-only Views should use:

```text
SECURITY INVOKER
```

Read-only Functions should use:

```text
SECURITY INVOKER
```

Administrative Functions and Stored Procedures should use:

```text
SECURITY DEFINER
```

only where required, and should be callable only by trusted backend/service-role operations.

---

# Security Note: Views and Row Level Security

API Views must be created using:

```text
security_invoker = true
```

This preserves Row Level Security behavior by evaluating policies against the calling user rather than the view owner.

---

# Naming Standards

Views

```text
*_view
```

Functions

```text
verb_noun()
```

Examples

```text
calculate_wallet_balance()

award_badge()

is_feature_enabled()
```

Stored Procedures

```text
verb_noun()
```

Examples

```text
distribute_campaign()

archive_campaign()

create_performance_bonus()
```

---

# Future Expansion

Future API objects may include:

```text
Search Functions

Recommendation Views

Analytics Views

Materialized Views

Webhook Procedures

Maintenance Procedures
```

---

# Future AI Usage

The API layer will support:

```text
AI Dashboard Generation

AI Reporting

AI Recommendation Engine

AI Campaign Optimization

AI Reputation Insights

AI Platform Analytics
```

---

# API Schema Status

```text
Schema:
api

Views:
11

Functions:
9

Stored Procedures:
6

Materialized Views:
0

Status:
FINAL

READY FOR ARCHITECTURE REVIEW
```