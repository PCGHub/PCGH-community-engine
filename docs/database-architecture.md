# PCGH Database Architecture

## Overview

This document defines the relational database architecture for the PCGH Community Engine.

The database architecture is organized into logical layers based on platform functionality and engine dependencies.

---

# PHASE 1 — RELATIONAL DATABASE DESIGN

Status: **IN PROGRESS**

---

# LAYER 1 — Identity & Community Foundation

Status: ✅ COMPLETED

## Purpose

This layer defines:

* User identity
* User roles
* Creator circles
* Member communities
* Group assignment foundations
* Visibility rules

## Tables

### Identity

* users
* user_roles

### Creator Circles

* creator_circles
* creator_circle_members

### Member Communities

* member_communities
* member_community_members

## Relationships

```text
users
    |
    +------------------+
    |                  |
user_roles     creator_circle_members
    |                  |
    |                  |
member_community_members
    |                  |
    +------------------+
             |
             |
    creator_circles
    member_communities
```

---

# LAYER 2 — Campaign & Credit System

Status: ✅ COMPLETED

## Purpose

This layer defines:

* Creator wallets
* Credit accounting
* Campaign management
* Campaign budgeting
* Campaign distribution tracking

## Tables

### Credits

* credit_wallets
* credit_transactions

### Campaigns

* campaigns
* campaign_asset

### Distribution

* campaign_distributions

## Relationships

```text
users
    |
credit_wallets
    |
credit_transactions

users
    |
campaigns
    |
campaign_asset
    |
campaign_distributions
```

---

# LAYER 3 — Discovery Assignment System

Status: ✅ COMPLETED

## Purpose

This layer transforms creator campaigns into community discovery opportunities.

## Tables

* discovery_opportunities
* community_assignments
* member_assignments
* assignment_history

## Flow

```text
Creator
    ↓
Campaign
    ↓
Discovery Opportunity
    ↓
Community Assignment
    ↓
Member Assignment
    ↓
Audience Amplification
```

---

# LAYER 4 — Rotation Engine

Status: ✅ Completed

## Purpose

This layer prevents suspicious engagement patterns and enforces audience diversity.

## Tables

* rotation_history
* community_cooldowns
* member_cooldowns
* community_exclusions

## Responsibilities

* Rotation management
* Cooldown management
* Anti-pattern detection
* Diversity enforcement
* Self-exposure prevention

---

# LAYER 5 — Reputation, Recognition & Analytics

Status: ⏳ PENDING

## Purpose

This layer calculates performance, reputation, recognition, and overall platform health.

It provides:

* Member reputation scoring
* Creator reputation scoring
* Community reputation scoring
* Performance recognition
* Admin appreciation bonuses
* Community health analytics
* Creator performance analytics
* Platform-wide analytics

---

## Reputation Tables

### Member Reputation

* member_reputation

### Creator Reputation

* creator_reputation

### Community Reputation

* community_reputation

---

## Recognition Tables

### Performance Bonus Events

* performance_bonus

### Performance Bonus Recipients

* performance_bonus_members

---

## Analytics Tables

### Analytics Events

* analytics_events

### Analytics Reports

* analytics_reports

---

## Responsibilities

### Reputation Engine

* Participation scoring
* Activity scoring
* Consistency scoring
* Authenticity scoring
* Community reputation scoring

### Recognition Engine

* Community appreciation bonuses
* Creator appreciation bonuses
* Seasonal bonuses
* Event bonuses
* Manual admin recognition
* Recognition badges

### Analytics Engine

* Community performance analytics
* Creator performance analytics
* Audience amplification analytics
* Platform health analytics
* Growth analytics

---

## Example Recognition Flow

```text
Community M001
        ↓
Participation: 95%
        ↓
Admin decides to recognize performance
        ↓
Create Performance Bonus Event
        ↓
Award 1000 Bonus Credits
        ↓
100 Members Receive Bonus Credits
```

---

## Example Tables

### performance_bonus

```text
id
community_id
issued_by
bonus_amount
reason
created_at
```

### performance_bonus_members

```text
id
bonus_id
user_id
amount
status
created_at
```


# LAYER 6 — Feature Management & Platform Control

Status: ⏳ PENDING

## Purpose

This layer controls feature rollout and platform configuration.

## Tables

* feature_flags
* system_settings

## Example Feature Flags

```json
{
  "AUDIENCE_MATCHING_ENABLED": false,
  "MULTI_CONTENT_CAMPAIGN_ENABLED": false,
  "COMMUNITY_CHAT_ENABLED": false,
  "LEADERBOARD_ENABLED": false,
  "AI_RECOMMENDATION_ENABLED": false,
  "CREATOR_COLLABORATION_ENABLED": false
}
```

---

# Database Progress Tracker

| Layer   | Component                       | Status |
| ------- | ------------------------------- | ------ |
| Layer 1 | Identity & Community Foundation | ✅      |
| Layer 2 | Campaign & Credit System        | ✅      |
| Layer 3 | Discovery Assignment System     | 🔄     |
| Layer 4 | Rotation Engine                 | ⏳      |
| Layer 5 | Reputation & Analytics          | ⏳      |
| Layer 6 | Feature Management              | ⏳      |

---

# PCGH Core Database Philosophy

* One user can have multiple roles.
* Creator Circles are limited to 100 creators.
* Member Communities are limited to 100 members.
* One campaign equals one content asset in V1.
* Audience matching is disabled by default.
* Discovery opportunities replace traditional task systems.
* Distribution logic remains hidden from creators and members.
* The admin has complete platform visibility.

```
```
