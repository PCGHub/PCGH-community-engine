# PCGH Rankings

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.rankings
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `rankings` table represents the global ranking engine of the PCGH platform.

It consolidates reputation, achievements, badges, campaign performance, discovery activity, and community participation into a single ranking score.

This table powers leaderboards, AI recommendations, creator visibility, community recognition, and platform-wide competition.

---

# Responsibilities

The table manages:

* Global rankings
* Creator rankings
* Member rankings
* Community rankings
* Ranking history
* Leaderboards
* AI ranking inputs

---

# Structure

```sql id="ranking_structure"
intelligence.rankings
---------------------

id UUID PRIMARY KEY

user_id UUID NULL
REFERENCES identity.users(id)

community_id UUID NULL
REFERENCES identity.member_communities(id)

ranking_type VARCHAR(30)

ranking_score DECIMAL(10,2)

ranking_position INTEGER

previous_position INTEGER

movement INTEGER DEFAULT 0

reputation_score DECIMAL(8,2)

achievement_points INTEGER DEFAULT 0

badge_points INTEGER DEFAULT 0

performance_score DECIMAL(5,2)

activity_score DECIMAL(5,2)

calculated_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Ranking Types

```text id="ranking_types"
Global

Creator

Member

Community

Campaign

Seasonal

Monthly

Weekly
```

---

# Ranking Philosophy

Rankings represent the current competitive standing within the PCGH ecosystem.

Rankings are recalculated automatically using multiple platform signals including:

* Reputation
* Achievements
* Badges
* Discovery performance
* Community participation
* Campaign consistency

Rankings are dynamic and change as platform activity evolves.

---

# Business Rules

```text id="ranking_rules"
Rankings are automatically recalculated.

Ranking positions are unique within each ranking type.

Historical ranking snapshots are stored separately.

Movement represents position gained or lost since the previous calculation.

AI may influence future ranking algorithms.

Administrators may trigger manual recalculations.
```

---

# Example

```text id="ranking_example"
Creator:
Victor

Ranking Type:
Global

Current Position:
4

Previous Position:
7

Movement:
+3

Ranking Score:
9845.70

Reputation:
915.40

Achievements:
520

Badges:
18

Performance:
96.80

Activity:
94.60
```

---

# Recommended Indexes

```sql id="ranking_indexes"
INDEX rankings_user_idx(user_id)

INDEX rankings_community_idx(community_id)

INDEX rankings_type_idx(ranking_type)

INDEX rankings_score_idx(ranking_score)

INDEX rankings_position_idx(ranking_position)

INDEX rankings_calculated_idx(calculated_at)
```

---

# Relationships

```text id="ranking_relationships"
member_reputation
        ↓

creator_reputation
        ↓

community_reputation
        ↓

user_badges
        ↓

user_achievements
        ↓

rankings
        ↓

performance_bonuses
```

---

# Future AI Usage

```text id="ranking_ai"
AI Leaderboards

AI Personalized Rankings

AI Trending Creators

AI Community Recommendations

AI Discovery Prioritization

AI Growth Predictions
```

---

# Table Status

```text id="ranking_status"
Table:
intelligence.rankings

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
