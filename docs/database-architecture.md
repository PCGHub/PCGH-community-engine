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

Status: 🔄 NEXT

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

Status: ⏳ PENDING

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

# LAYER 5 — Reputation & Analytics

Status: ⏳ PENDING

## Purpose

This layer calculates performance, reputation, and platform health.

## Tables

### Reputation

* member_reputation
* creator_reputation
* community_reputation

### Analytics

* analytics_events
* analytics_reports

## Responsibilities

* Participation scoring
* Reputation scoring
* Community health
* Creator performance
* Platform analytics

---

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
