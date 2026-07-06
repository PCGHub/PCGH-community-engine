# PCGH Achievements

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.achievements
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `achievements` table defines every achievement that can be earned on the PCGH platform.

Achievements represent measurable milestones based on platform participation, reputation, discovery performance, community contribution, and creator success.

Unlike badges, achievements are objective milestones that can automatically trigger badge awards, reputation increases, rankings, and performance bonuses.

---

# Responsibilities

The table manages:

* Achievement definitions
* Achievement categories
* Achievement requirements
* Reward configuration
* Badge linkage
* Visibility
* Achievement lifecycle

---

# Structure

```sql id="achievement_structure"
intelligence.achievements
-------------------------

id UUID PRIMARY KEY

achievement_code VARCHAR(30) UNIQUE

name VARCHAR(150)

description TEXT

category VARCHAR(50)

difficulty VARCHAR(30)

badge_id UUID NULL
REFERENCES intelligence.badges(id)

required_value INTEGER

reward_points INTEGER DEFAULT 0

reward_reputation DECIMAL(8,2) DEFAULT 0

is_repeatable BOOLEAN DEFAULT false

is_hidden BOOLEAN DEFAULT false

is_active BOOLEAN DEFAULT true

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Achievement Categories

```text id="achievement_categories"
Participation

Discovery

Creator

Community

Reputation

Campaign

Consistency

Leadership

Special

Anniversary
```

---

# Difficulty Levels

```text id="achievement_difficulty"
Starter

Bronze

Silver

Gold

Platinum

Legendary
```

---

# Achievement Philosophy

Achievements represent measurable accomplishments.

Unlike badges, achievements always have defined completion criteria.

Completing an achievement may:

* Award one or more badges
* Increase reputation
* Improve rankings
* Unlock new platform features
* Trigger AI recommendations
* Award performance bonuses

---

# Business Rules

```text id="achievement_rules"
Achievement codes are unique.

Inactive achievements cannot be earned.

Hidden achievements remain invisible until unlocked.

Repeatable achievements may be earned multiple times.

Non-repeatable achievements may only be completed once.

Achievements may optionally award a badge.
```

---

# Example

```text id="achievement_example"
Achievement:
Community Champion

Code:
ACH_COMMUNITY_001

Category:
Community

Difficulty:
Gold

Required Value:
100

Reward Points:
500

Reward Reputation:
25.00

Badge:
Community Champion
```

---

# Recommended Indexes

```sql id="achievement_indexes"
INDEX achievements_code_idx(achievement_code)

INDEX achievements_category_idx(category)

INDEX achievements_difficulty_idx(difficulty)

INDEX achievements_active_idx(is_active)

INDEX achievements_badge_idx(badge_id)
```

---

# Relationships

```text id="achievement_relationships"
achievements
        ↓
user_achievements

achievements
        ↓
badges

achievements
        ↓
member_reputation

achievements
        ↓
creator_reputation

achievements
        ↓
community_reputation
```

---

# Future AI Usage

```text id="achievement_ai"
AI Achievement Recommendations

AI Milestone Prediction

AI Personalized Goals

AI Progress Coaching

AI Retention Optimization
```

---

# Table Status

```text id="achievement_status"
Table:
intelligence.achievements

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
