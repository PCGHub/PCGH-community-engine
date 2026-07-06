# PCGH Member Reputation

## Schema

```text
intelligence
```

## Table

```text
intelligence.member_reputation
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `member_reputation` table stores the trust, reliability, and participation reputation of every community member.

This reputation is earned through genuine participation across the PCGH platform and is used to improve discovery quality, recognize valuable members, and support future AI-driven recommendations.

---

# Responsibilities

The table measures:

* Member trust
* Participation consistency
* Discovery activity
* Community contribution
* Platform reliability
* Long-term reputation

---

# Structure

```sql
intelligence.member_reputation
------------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

community_id UUID
REFERENCES identity.member_communities(id)

reputation_score DECIMAL(8,2) DEFAULT 100.00

lifetime_reputation DECIMAL(10,2) DEFAULT 100.00

trust_level VARCHAR(30)

discoveries_received INTEGER DEFAULT 0

discoveries_viewed INTEGER DEFAULT 0

discoveries_visited INTEGER DEFAULT 0

discoveries_shared INTEGER DEFAULT 0

discoveries_saved INTEGER DEFAULT 0

discoveries_ignored INTEGER DEFAULT 0

consistency_score DECIMAL(5,2)

last_activity_at TIMESTAMP

calculated_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Trust Levels

```text
New

Bronze

Silver

Gold

Platinum

Elite
```

---

# Reputation Philosophy

Members gain reputation through:

```text
Consistent participation

Natural discovery

Positive community behavior

Platform trust

Long-term activity
```

Members lose reputation through:

```text
Repeated inactivity

Ignoring discoveries

Suspicious activity

Artificial behavior

Policy violations
```

---

# Lifetime Reputation

Lifetime reputation never decreases.

It represents the member's historical contribution to the platform.

Current reputation may increase or decrease based on recent activity, while lifetime reputation remains as a permanent record of long-term trust.

---

# Business Rules

```text
One reputation profile per member.

Reputation is continuously recalculated.

Historical calculations are stored separately.

Scores cannot be manually edited except by administrators.

Reputation never becomes negative.

Lifetime reputation never decreases.
```

---

# Example

```text
Member:
Victor

Community:
M014

Current Reputation:
842.75

Lifetime Reputation:
1348.90

Trust:
Gold

Discoveries Received:
520

Viewed:
490

Visited:
440

Shared:
105

Saved:
87

Ignored:
12

Consistency:
94.60%
```

---

# Recommended Indexes

```sql
INDEX member_reputation_user_idx(user_id)

INDEX member_reputation_community_idx(community_id)

INDEX member_reputation_score_idx(reputation_score)

INDEX member_reputation_lifetime_idx(lifetime_reputation)

INDEX member_reputation_trust_idx(trust_level)

INDEX member_reputation_activity_idx(last_activity_at)
```

---

# Relationships

```text
identity.users
        ↓
member_reputation

identity.member_communities
        ↓
member_reputation

member_reputation
        ↓
user_badges

member_reputation
        ↓
rankings
```

---

# Future AI Usage

```text
AI Trust Scoring

AI Discovery Prioritization

AI Community Matching

AI Fraud Detection

AI Reputation Prediction

AI Quality Ranking
```

---

# Table Status

```text
Table:
intelligence.member_reputation

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
