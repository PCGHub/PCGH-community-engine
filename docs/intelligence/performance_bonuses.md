# PCGH Performance Bonuses

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.performance_bonuses
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `performance_bonuses` table records every performance-based bonus awarded within the PCGH platform.

Performance bonuses recognize exceptional contributions from members, creators, and communities.

Unlike payments, these bonuses are platform incentives designed to encourage long-term quality, consistency, and responsible participation.

---

# Responsibilities

The table manages:

* Performance bonus awards
* Bonus history
* Reputation bonuses
* Credit bonuses
* Recognition bonuses
* AI-generated bonus recommendations

---

# Structure

```sql id="performance_bonus_structure"
intelligence.performance_bonuses
--------------------------------

id UUID PRIMARY KEY

user_id UUID NULL
REFERENCES identity.users(id)

community_id UUID NULL
REFERENCES identity.member_communities(id)

bonus_code VARCHAR(30) UNIQUE

bonus_type VARCHAR(50)

bonus_reason TEXT

credit_bonus INTEGER DEFAULT 0

reputation_bonus DECIMAL(8,2) DEFAULT 0

achievement_points INTEGER DEFAULT 0

ranking_bonus INTEGER DEFAULT 0

awarded_by UUID NULL
REFERENCES identity.users(id)

award_source VARCHAR(50)

awarded_at TIMESTAMP

expires_at TIMESTAMP NULL

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Bonus Types

```text id="bonus_types"
Performance

Consistency

Community Excellence

Creator Excellence

Discovery Excellence

Leadership

Special Event

Administrative

AI Recommendation
```

---

# Award Sources

```text id="bonus_sources"
Automatic

Administrator

AI Engine

Campaign

Community

Seasonal Event

Platform Milestone
```

---

# Performance Bonus Philosophy

Performance bonuses recognize sustained excellence.

Bonuses may reward:

* Outstanding campaign performance
* High community participation
* Consistent platform activity
* Exceptional creator quality
* Community leadership
* Long-term contribution

Performance bonuses encourage healthy platform growth rather than artificial engagement.

---

# Business Rules

```text id="performance_bonus_rules"
Every bonus award is permanently recorded.

Bonuses may include one or more reward types.

Expired bonuses remain in history.

Bonus awards never modify historical records.

Administrators may manually issue bonuses.

AI may recommend future bonus awards.
```

---

# Example

```text id="performance_bonus_example"
User:
Victor

Bonus Type:
Creator Excellence

Reason:
Top Performing Creator - July 2026

Credit Bonus:
500

Reputation Bonus:
35.00

Achievement Points:
250

Ranking Bonus:
10

Award Source:
Automatic

Awarded:
2026-08-01
```

---

# Recommended Indexes

```sql id="performance_bonus_indexes"
INDEX performance_bonus_user_idx(user_id)

INDEX performance_bonus_community_idx(community_id)

INDEX performance_bonus_type_idx(bonus_type)

INDEX performance_bonus_source_idx(award_source)

INDEX performance_bonus_awarded_idx(awarded_at)
```

---

# Relationships

```text id="performance_bonus_relationships"
member_reputation
        ↓

creator_reputation
        ↓

community_reputation
        ↓

rankings
        ↓

performance_bonuses

performance_bonuses
        ↓

credit_wallets
```

---

# Future AI Usage

```text id="performance_bonus_ai"
AI Bonus Recommendations

AI Incentive Optimization

AI Seasonal Reward Programs

AI Community Recognition

AI Creator Recognition

AI Performance Forecasting
```

---

# Table Status

```text id="performance_bonus_status"
Table:
intelligence.performance_bonuses

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
