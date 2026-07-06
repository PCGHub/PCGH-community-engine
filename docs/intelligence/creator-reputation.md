# PCGH Creator Reputation

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.creator_reputation
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `creator_reputation` table measures the trustworthiness, quality, and long-term credibility of creators on the PCGH platform.

Unlike member reputation, creator reputation is calculated from campaign quality, community response, consistency, and responsible platform usage.

This score influences future discovery priority, platform recognition, and AI-assisted campaign distribution.

---

# Responsibilities

The table measures:

* Creator trust
* Campaign quality
* Discovery performance
* Community satisfaction
* Platform credibility
* Long-term creator reputation

---

# Structure

```sql id="creator_reputation_structure"
intelligence.creator_reputation
-------------------------------

id UUID PRIMARY KEY

creator_id UUID
REFERENCES identity.users(id)

reputation_score DECIMAL(8,2) DEFAULT 100.00

lifetime_reputation DECIMAL(10,2) DEFAULT 100.00

trust_level VARCHAR(30)

creator_tier VARCHAR(30)

campaigns_created INTEGER DEFAULT 0

campaigns_completed INTEGER DEFAULT 0

discovery_opportunities_generated INTEGER DEFAULT 0

communities_reached INTEGER DEFAULT 0

average_performance_score DECIMAL(5,2)

consistency_score DECIMAL(5,2)

last_campaign_at TIMESTAMP

calculated_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Trust Levels

```text id="creator_trust_levels"
New

Bronze

Silver

Gold

Platinum

Elite
```

---

# Creator Tiers

```text id="creator_tiers"
Standard

Verified

Partner

Premium

Enterprise
```

---

# Reputation Philosophy

Creators gain reputation through:

```text id="creator_gain"
Publishing quality campaigns

Positive community response

Consistent participation

Responsible platform usage

Long-term contribution
```

Creators lose reputation through:

```text id="creator_loss"
Repeated poor-performing campaigns

Spam submissions

Artificial amplification attempts

Policy violations

Extended inactivity
```

---

# Creator Tier Philosophy

Creator Tier represents the creator's business classification within the PCGH ecosystem.

Unlike Trust Level, Creator Tier is not calculated from platform behavior alone.

It may be be determined by:

* Subscription plan
* Account verification
* Partnership status
* Enterprise agreements
* Administrative approval

A creator's Trust Level and Creator Tier are independent values.

---

# Lifetime Reputation

Lifetime reputation never decreases.

It reflects the creator's total historical contribution to the PCGH ecosystem.

Current reputation may increase or decrease based on recent campaign quality.

---

# Business Rules

```text id="creator_business_rules"
One reputation profile per creator.

Reputation is automatically recalculated.

Historical calculations are stored separately.

Current reputation may increase or decrease.

Lifetime reputation never decreases.

Scores cannot become negative.

Administrators may manually review reputation changes.
```

---

# Example

```text id="creator_example"
Creator:
Victor

Current Reputation:
915.40

Lifetime Reputation:
1862.75

Trust:
Platinum

Creator Tier:
Verified

Campaigns Created:
84

Campaigns Completed:
81

Discovery Opportunities:
81

Communities Reached:
247

Average Performance:
92.80%

Consistency:
96.40%
```

---

# Recommended Indexes

```sql id="creator_indexes"
INDEX creator_reputation_creator_idx(creator_id)

INDEX creator_reputation_score_idx(reputation_score)

INDEX creator_reputation_lifetime_idx(lifetime_reputation)

INDEX creator_reputation_trust_idx(trust_level)

INDEX creator_reputation_tier_idx(creator_tier)

INDEX creator_reputation_last_campaign_idx(last_campaign_at)
```

---

# Relationships

```text id="creator_relationships"
identity.users
        ↓
creator_reputation

economy.campaigns
        ↓
creator_reputation

discovery.discovery_opportunities
        ↓
creator_reputation

creator_reputation
        ↓
user_badges

creator_reputation
        ↓
rankings

creator_reputation
        ↓
performance_bonuses
```

---

# Future AI Usage

```text id="creator_ai_usage"
AI Creator Trust Scoring

AI Campaign Prioritization

AI Discovery Optimization

AI Creator Recommendations

AI Reputation Prediction

AI Fraud Detection
```

---

# Table Status

```text id="creator_status"
Table:
intelligence.creator_reputation

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
