# PCGH User Badges

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.user_badges
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `user_badges` table records every badge awarded across the PCGH platform.

Unlike the `badges` table, which defines badge types, this table stores actual badge ownership by members, creators, and communities.

It provides a permanent achievement history and serves as the foundation for profile recognition, rankings, and future AI personalization.

---

# Responsibilities

The table manages:

* Badge ownership
* Badge award history
* Automatic badge awards
* Administrative badge awards
* AI-recommended badge awards
* Badge visibility

---

# Structure

```sql id="user_badges_structure"
intelligence.user_badges
------------------------

id UUID PRIMARY KEY

badge_id UUID
REFERENCES intelligence.badges(id)

user_id UUID
REFERENCES identity.users(id)

awarded_by UUID NULL
REFERENCES identity.users(id)

award_source VARCHAR(50)

award_reason TEXT

is_featured BOOLEAN DEFAULT false

awarded_at TIMESTAMP

created_at TIMESTAMP
```

---

# Award Sources

```text id="award_sources"
Automatic

Administrator

AI Engine

Special Event

Campaign

Community

Migration
```

---

# Badge Award Philosophy

Badges represent permanent achievements.

Once awarded:

* They are never deleted.
* They remain part of the user's historical profile.
* They contribute to platform recognition.
* They may influence future rankings.
* They may be used by AI recommendation systems.

Featured badges may be displayed prominently on user profiles.

---

# Business Rules

```text id="user_badge_rules"
One badge may only be awarded once to the same user unless the badge definition explicitly allows multiple awards.

Badge ownership is permanent.

Award history is immutable.

Hidden badges become visible immediately after being awarded.

Administrators may revoke badges only under exceptional circumstances such as fraud or policy violations.
```

---

# Example

```text id="user_badge_example"
User:
Victor

Badge:
Top Creator

Award Source:
Automatic

Award Reason:
Completed 100 successful campaigns.

Featured:
Yes

Awarded:
2026-08-15
```

---

# Recommended Indexes

```sql id="user_badges_indexes"
INDEX user_badges_user_idx(user_id)

INDEX user_badges_badge_idx(badge_id)

INDEX user_badges_awarded_idx(awarded_at)

INDEX user_badges_featured_idx(is_featured)

INDEX user_badges_source_idx(award_source)
```

---

# Relationships

```text id="user_badges_relationships"
identity.users
        ↓
user_badges

intelligence.badges
        ↓
user_badges

user_badges
        ↓
rankings

user_badges
        ↓
member_reputation

user_badges
        ↓
creator_reputation
```

---

# Future AI Usage

```text id="user_badges_ai"
AI Badge Recommendations

AI Personalized Recognition

AI Profile Enhancement

AI Achievement Suggestions

AI Reputation Analysis
```

---

# Table Status

```text id="user_badges_status"
Table:
intelligence.user_badges

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
