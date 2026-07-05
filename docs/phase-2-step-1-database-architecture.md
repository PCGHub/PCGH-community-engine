# PCGH Community Engine

# PHASE 2 — STEP 1

# Physical Database Design

---

## Project

PCGH (Puricasie Creators Growth Hub)

## Phase

Phase 2 — Implementation

## Step

Step 1 — Physical Database Design

## Status

✅ LOCKED

## Date

July 2026

---

# Objective

The objective of Step 1 is to convert the approved Phase 1 architecture into a production-ready physical database architecture.

The physical database architecture becomes the foundation for:

* Supabase implementation
* Database migrations
* Row Level Security
* Backend services
* APIs
* Dashboards
* Analytics
* Future AI systems

---

# Database Architecture Strategy

PCGH officially adopts:

```text
MULTI-SCHEMA DATABASE ARCHITECTURE
```

This architecture provides:

* Scalability
* Security
* Maintainability
* Separation of concerns
* Independent service ownership
* Future AI integration support

---

# Approved Database Schemas

The following schemas are officially approved.

---

# Schema 1

## identity

### Purpose

Stores identity and community structures.

### Tables

```text
identity.users

identity.user_roles

identity.creator_circles

identity.creator_circle_members

identity.member_communities

identity.member_community_members
```

### Ownership

```text
Identity Service
```

---

# Schema 2

## economy

### Purpose

Stores credits, campaigns, and spending.

### Tables

```text
economy.credit_wallets

economy.credit_transactions

economy.campaigns

economy.campaign_asset

economy.campaign_distributions
```

### Ownership

```text
Economy Service
```

---

# Schema 3

## discovery

### Purpose

Stores discovery opportunities and assignments.

### Tables

```text
discovery.discovery_opportunities

discovery.community_assignments

discovery.member_assignments

discovery.assignment_history
```

### Ownership

```text
Discovery Service
```

---

# Schema 4

## protection

### Purpose

Stores platform protection mechanisms.

### Tables

```text
protection.rotation_history

protection.community_cooldowns

protection.member_cooldowns

protection.community_exclusions

protection.community_performance_history
```

### Ownership

```text
Protection Service
```

---

# Schema 5

## intelligence

### Purpose

Stores reputation, recognition, and platform intelligence.

### Tables

```text
intelligence.member_reputation

intelligence.creator_reputation

intelligence.community_reputation

intelligence.creator_badges

intelligence.community_badges

intelligence.performance_bonus

intelligence.performance_bonus_members
```

### Ownership

```text
Intelligence Service
```

---

# Schema 6

## analytics

### Purpose

Stores analytics, events, reports, and metrics.

### Tables

```text
analytics.member_analytics

analytics.community_analytics

analytics.creator_analytics

analytics.platform_analytics

analytics.analytics_events

analytics.analytics_reports
```

### Ownership

```text
Analytics Service
```

---

# Schema 7

## governance

### Purpose

Stores platform governance and evolution controls.

### Tables

```text
governance.feature_flags

governance.system_settings

governance.governance_rules

governance.admin_overrides

governance.platform_experiments

governance.ai_controls
```

### Ownership

```text
Governance Service
```

---

# Database Ownership Model

```text
identity
        ↓
economy
        ↓
discovery
        ↓
protection
        ↓
intelligence
        ↓
analytics
        ↓
governance
```

---

# Cross-Schema Relationship Philosophy

Schemas remain logically independent but may reference each other through foreign keys.

Examples:

```text
economy.campaigns.creator_id
        ↓
identity.users.id
```

```text
discovery.discovery_opportunities.campaign_id
        ↓
economy.campaigns.id
```

```text
intelligence.member_reputation.user_id
        ↓
identity.users.id
```

```text
analytics.creator_analytics.creator_id
        ↓
identity.users.id
```

---

# Security Philosophy

Each schema owns its own security model.

Examples:

```text
identity
    own RLS policies

economy
    own RLS policies

discovery
    own RLS policies

protection
    own RLS policies

intelligence
    own RLS policies

analytics
    own RLS policies

governance
    own RLS policies
```

---

# Database Design Principles

PCGH databases must support:

* Unlimited communities
* Unlimited creator circles
* Community auto-assignment
* Creator auto-assignment
* Discovery history
* Rotation history
* Reputation history
* Recognition history
* Analytics history
* Governance history

Historical data must never be deleted unless explicitly archived.

---

# Future Expansion

Additional schemas may be added in future versions.

Examples:

```text
ai

marketplace

billing

notifications

integrations
```

These schemas are not part of the Phase 2 implementation scope.

---

# Architecture Status

```text
DATABASE ARCHITECTURE

TYPE:
MULTI-SCHEMA

SCHEMAS:
7

STATUS:
LOCKED
```

---

# Next Step

```text
PHASE 2

STEP 2

IDENTITY SCHEMA DESIGN
```

This becomes the first implementation target for the PCGH database.
