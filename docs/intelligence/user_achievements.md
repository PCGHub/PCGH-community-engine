# PCGH User Achievements

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.user_achievements
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `user_achievements` table records every achievement earned by users on the PCGH platform.

Unlike the `achievements` table, which defines achievement rules, this table stores actual achievement completion records for members, creators, and administrators.

It serves as the permanent historical record of platform accomplishments.

---

# Responsibilities

The table manages:

* Achievement ownership
* Achievement completion history
* Automatic achievement awards
* Administrative achievement awards
* AI-assisted achievement awards
* Achievement progress
* Achievement visibility

---

# Structure

```sql id="user_achievement_structure"
intelligence.user_achievements
------------------------------

id UUID PRIMARY KEY

achievement_id UUID
REFERENCES intelligence.achievements(id)

user_id UUID
REFERENCES identity.users(id)

completed_value INTEGER

required_value INTEGER

completion_percentage DECIMAL(5,2)

completed BOOLEAN DEFAULT false

completed_at TIMESTAMP NULL

awarded_by UUID NULL
REFERENCES identity.users(id)

award_source VARCHAR(50)

notes TEXT

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Award Sources

```text id="achievement_sources"
Automatic

Administrator

AI Engine

Campaign

Community

Migration

Special Event
```

---

# Achievement Philosophy

Achievements represent measurable accomplishments.

Progress is tracked continuously.

When an achievement reaches 100% completion, it may automatically:

* Award badges
* Increase reputation
* Improve rankings
* Unlock platform features
* Trigger AI recommendations
* Award performance bonuses

Achievement history is permanent.

---

# Business Rules

```text id="user_achievement_rules"
One active record per user per achievement.

Progress may increase over time.

Completion cannot exceed 100%.

Completed achievements remain permanently recorded.

Repeatable achievements create new completion records.

Historical records are never deleted.
```

---

# Example

```text id="user_achievement_example"
User:
Victor

Achievement:
Community Champion

Progress:
100%

Completed:
Yes

Award Source:
Automatic

Completed At:
2026-08-18
```

---

# Recommended Indexes

```sql id="user_achievement_indexes"
INDEX user_achievement_user_idx(user_id)

INDEX user_achievement_achievement_idx(achievement_id)

INDEX user_achievement_completed_idx(completed)

INDEX user_achievement_completed_at_idx(completed_at)

INDEX user_achievement_source_idx(award_source)
```

---

# Relationships

```text id="user_achievement_relationships"
identity.users
        ↓
user_achievements

intelligence.achievements
        ↓
user_achievements

user_achievements
        ↓
user_badges

user_achievements
        ↓
member_reputation

user_achievements
        ↓
creator_reputation

user_achievements
        ↓
community_reputation

user_achievements
        ↓
rankings
```

---

# Future AI Usage

```text id="user_achievement_ai"
AI Achievement Coaching

AI Progress Forecasting

AI Personalized Goals

AI Retention Analysis

AI Performance Recommendations

AI Recognition Suggestions
```

---

# Table Status

```text id="user_achievement_status"
Table:
intelligence.user_achievements

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
