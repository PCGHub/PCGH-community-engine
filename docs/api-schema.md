# PCGH Views & Functions Schema

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

The API Schema provides reusable database views, SQL functions, and stored procedures for the PCGH platform.

Unlike the core business schemas, this schema does not own business data.

Instead, it exposes a secure, reusable, and optimized interface over the underlying schemas.

The API Schema serves as the primary database interface consumed by:

- Backend Services
- Admin Dashboard
- Creator Dashboard
- Member Dashboard
- Mobile Applications
- AI Services
- Analytics Engine

---

# Design Philosophy

The API layer exists to:

- Simplify complex SQL queries
- Reduce duplicated business logic
- Improve reporting performance
- Provide consistent data access
- Centralize reusable calculations
- Support future API development

Business data remains inside its own schema.

The API schema only exposes controlled access.

---

# Dependencies

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
       api
```

---

# Database Views

Views provide read-only representations of platform data.

Views never own data.

---

## View 1

### api.creator_dashboard_view

Displays:

- Creator profile
- Wallet balance
- Active campaigns
- Campaign performance
- Reputation
- Earned badges
- Discovery statistics

---

## View 2

### api.member_dashboard_view

Displays:

- Member profile
- Wallet balance
- Reputation
- Pending assignments
- Completed assignments
- Earned badges
- Performance bonuses

---

## View 3

### api.community_dashboard_view

Displays:

- Community reputation
- Active campaigns
- Members
- Engagement statistics
- Performance history
- Discovery opportunities

---

## View 4

### api.campaign_summary_view

Displays:

- Campaign
- Creator
- Budget
- Credits spent
- Communities reached
- Engagement statistics
- Campaign status

---

## View 5

### api.discovery_summary_view

Displays:

- Discovery opportunities
- Community assignments
- Member assignments
- Completion rate
- Distribution statistics

---

## View 6

### api.wallet_summary_view

Displays:

- Current balance
- Lifetime earned
- Lifetime spent
- Pending bonuses
- Available credits

---

## View 7

### api.reputation_leaderboard_view

Displays:

- Top creators
- Top members
- Top communities
- Reputation rankings
- Badge counts

---

## View 8

### api.platform_statistics_view

Displays:

- Total users
- Total creators
- Total communities
- Total campaigns
- Total credits
- Discovery statistics
- Reputation statistics

---

# SQL Functions

Functions centralize reusable business logic.

---

## calculate_member_reputation()

Recalculates a member's reputation.

---

## calculate_creator_reputation()

Recalculates creator reputation.

---

## calculate_community_reputation()

Recalculates community reputation.

---

## award_badge()

Awards a badge to a user.

Automatically creates an achievement_history record.

---

## revoke_badge()

Removes an awarded badge.

Historical achievement records remain unchanged.

---

## credit_performance_bonus()

Credits an approved performance bonus.

Updates:

- Wallet
- Credit transaction
- Bonus status

---

## refresh_reputation_rankings()

Refreshes reputation leaderboards.

---

## calculate_campaign_performance()

Calculates campaign performance statistics.

---

## calculate_wallet_balance()

Returns a user's current wallet balance.

---

## creator_on_cooldown()

Returns TRUE when a creator is currently restricted from community distribution.

---

# Stored Procedures

Stored procedures execute transactional operations involving multiple tables.

---

## approve_performance_bonus()

Approves a pending performance bonus.

---

## distribute_campaign()

Creates:

- Community distributions
- Discovery assignments
- Member assignments

---

## rotate_campaign()

Performs creator-community rotation.

Updates protection history.

---

## archive_campaign()

Archives completed campaigns.

---

## restore_campaign()

Restores archived campaigns.

---

## close_campaign()

Marks a campaign as completed.

Calculates final statistics.

---

# Materialized Views

Currently disabled.

Future optimization only.

```text
ENABLE_MATERIALIZED_VIEWS = false
```

Future candidates:

```text
creator_statistics_mv

community_statistics_mv

daily_platform_statistics_mv

reputation_rankings_mv
```

---

# Security Philosophy

All API views inherit Row Level Security from their underlying tables.

Functions should use:

```text
SECURITY INVOKER
```

by default.

Administrative operations may use:

```text
SECURITY DEFINER
```

only after security review.

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

Examples:

```text
award_badge()

calculate_wallet_balance()

refresh_reputation_rankings()
```

Stored Procedures

```text
verb_noun()
```

Examples:

```text
distribute_campaign()

approve_performance_bonus()

archive_campaign()
```

---

# Future AI Usage

The API layer will support:

```text
AI Dashboard Generation

AI Analytics

AI Campaign Optimization

AI Recommendation Engine

AI Reputation Insights

AI Platform Reporting
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

Background Maintenance Procedures
```

---

# API Schema Status

```text
Schema:
api

Views:
8

Functions:
10

Stored Procedures:
6

Materialized Views:
0

Status:
FINAL

READY FOR CLAUDE REVIEW
```
