# PCGH Community Reputation

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.community_reputation
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `community_reputation` table measures the overall quality, health, trustworthiness, and historical performance of every PCGH community.

Unlike creator and member reputation, community reputation represents the collective effectiveness of an entire community.

This score helps the platform determine which communities should receive future discovery opportunities, recognition, and AI-optimized campaign distribution.

---

# Responsibilities

The table measures:

* Community trust
* Community performance
* Discovery effectiveness
* Member participation
* Historical consistency
* Long-term community reputation

---

# Structure

```sql id="community_reputation_structure"
intelligence.community_reputation
---------------------------------

id UUID PRIMARY KEY

community_id UUID
REFERENCES identity.member_communities(id)

reputation_score DECIMAL(8,2) DEFAULT 100.00

lifetime_reputation DECIMAL(10,2) DEFAULT 100.00

community_tier VARCHAR(30)

trust_level VARCHAR(30)

campaigns_received INTEGER DEFAULT 0

campaigns_completed INTEGER DEFAULT 0

members_count INTEGER DEFAULT 0

active_members INTEGER DEFAULT 0

average_participation_rate DECIMAL(5,2)

average_performance_score DECIMAL(5,2)

consistency_score DECIMAL(5,2)

last_campaign_at TIMESTAMP

calculated_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Trust Levels

```text id="community_trust_levels"
New

Bronze

Silver

Gold

Platinum

Elite
```

---

# Community Tiers

```text id="community_tiers"
Standard

Verified

Premium

Strategic

Flagship
```

---

# Reputation Philosophy

Communities gain reputation through:

```text id="community_gain"
High participation

Consistent discovery performance

Healthy member activity

Natural engagement

Long-term reliability
```

Communities lose reputation through:

```text id="community_loss"
Low participation

Repeated inactivity

High ignore rates

Suspicious behavior

Artificial activity
```

---

# Community Tier Philosophy

Community Tier represents the operational classification of a community.

Unlike Trust Level, Community Tier is assigned by the platform based on strategic importance and operational maturity.

Community Tier may be influenced by:

* Community size
* Historical performance
* Administrative designation
* Strategic campaigns
* Platform growth initiatives

Community Tier and Trust Level are independent values.

---

# Lifetime Reputation

Lifetime reputation never decreases.

It represents the cumulative contribution of the community to the PCGH ecosystem.

Current reputation reflects recent community performance.

---

# Business Rules

```text id="community_business_rules"
One reputation profile per community.

Reputation is automatically recalculated.

Historical calculations are preserved.

Current reputation may increase or decrease.

Lifetime reputation never decreases.

Scores cannot become negative.

Administrators may review or recalculate community reputation.
```

---

# Example

```text id="community_example"
Community:
M014

Current Reputation:
947.60

Lifetime Reputation:
2548.30

Trust:
Platinum

Community Tier:
Strategic

Campaigns Received:
312

Campaigns Completed:
308

Members:
100

Active Members:
94

Participation Rate:
93.80%

Performance:
95.60%

Consistency:
96.20%
```

---

# Recommended Indexes

```sql id="community_indexes"
INDEX community_reputation_community_idx(community_id)

INDEX community_reputation_score_idx(reputation_score)

INDEX community_reputation_lifetime_idx(lifetime_reputation)

INDEX community_reputation_trust_idx(trust_level)

INDEX community_reputation_tier_idx(community_tier)

INDEX community_reputation_last_campaign_idx(last_campaign_at)
```

---

# Relationships

```text id="community_relationships"
identity.member_communities
        ↓
community_reputation

discovery.community_assignments
        ↓
community_reputation

protection.community_performance_history
        ↓
community_reputation

community_reputation
        ↓
rankings

community_reputation
        ↓
performance_bonuses
```

---

# Future AI Usage

```text id="community_ai_usage"
AI Community Ranking

AI Distribution Optimization

AI Campaign Routing

AI Cooldown Optimization

AI Community Health Monitoring

AI Fraud Detection
```

---

# Table Status

```text id="community_status"
Table:
intelligence.community_reputation

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
