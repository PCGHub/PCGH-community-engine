# PCGH Badges

## Schema

```text id="schema_name"
intelligence
```

## Table

```text id="table_name"
intelligence.badges
```

## Status

FINAL

## Phase

Phase 2 — Implementation

---

# Purpose

The `badges` table defines every badge that can be awarded within the PCGH platform.

Badges recognize milestones, reputation, participation, performance, consistency, and special achievements.

Unlike user badges, this table only stores badge definitions.

---

# Responsibilities

The table manages:

* Badge definitions
* Badge categories
* Badge rarity
* Unlock requirements
* Badge visibility
* Badge lifecycle

---

# Structure

```sql id="badges_structure"
intelligence.badges
-------------------

id UUID PRIMARY KEY

badge_code VARCHAR(30) UNIQUE

name VARCHAR(100)

description TEXT

category VARCHAR(50)

rarity VARCHAR(30)

icon_url TEXT

color VARCHAR(30)

unlock_rule TEXT

points_required INTEGER DEFAULT 0

is_hidden BOOLEAN DEFAULT false

is_active BOOLEAN DEFAULT true

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

# Badge Categories

```text id="badge_categories"
Reputation

Performance

Participation

Consistency

Discovery

Community

Creator

Member

Special

Anniversary
```

---

# Badge Rarity

```text id="badge_rarity"
Common

Uncommon

Rare

Epic

Legendary

Mythic
```

---

# Badge Philosophy

Badges are permanent recognitions of significant milestones.

A badge may be:

* Automatically awarded
* Administratively awarded
* Event awarded
* AI recommended
* Platform exclusive

Badges represent accomplishments rather than temporary status.

---

# Business Rules

```text id="badge_rules"
Badge definitions are immutable.

Badge codes are unique.

Inactive badges cannot be awarded.

Hidden badges remain undisclosed until unlocked.

Administrators may introduce new badges without affecting existing awards.
```

---

# Example

```text id="badge_example"
Badge:
Top Creator

Code:
BADGE_TOP_CREATOR

Category:
Creator

Rarity:
Legendary

Points Required:
5000

Hidden:
No
```

---

# Recommended Indexes

```sql id="badge_indexes"
INDEX badges_code_idx(badge_code)

INDEX badges_category_idx(category)

INDEX badges_rarity_idx(rarity)

INDEX badges_active_idx(is_active)
```

---

# Relationships

```text id="badge_relationships"
badges
      ↓
user_badges

badges
      ↓
achievements
```

---

# Future AI Usage

```text id="badge_ai"
AI Badge Recommendations

AI Personalized Milestones

AI Progress Suggestions

AI Achievement Prediction
```

---

# Table Status

```text id="badge_status"
Table:
intelligence.badges

COMPLETENESS:
100%

STATUS:
FINAL

READY FOR CLAUDE IMPLEMENTATION
```
