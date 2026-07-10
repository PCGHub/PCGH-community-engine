# PCGH Intelligence Schema

## Schema

```text id="g8r2pv"
intelligence
```

## Status

LOCKED

## Phase

Phase 2 — Implementation

---

# Purpose

The Intelligence Schema manages:

* reputation
* recognition
* badges
* performance bonuses
* community intelligence

The Intelligence Schema transforms participation into trust, reputation, and recognition.

---

# Intelligence Philosophy

PCGH does not reward engagement.

PCGH recognizes:

* consistency
* participation
* community contribution
* amplification quality
* platform citizenship

---

# Tables

```text id="k4m9qw"
intelligence.member_reputation

intelligence.creator_reputation

intelligence.community_reputation

intelligence.badges

intelligence.user_badges

intelligence.performance_bonus

intelligence.performance_bonus_members

intelligence.achievement_history
```

---

# TABLE 1

# intelligence.member_reputation

## Purpose

Stores member reputation scores.

---

## Structure

```sql id="m7r2px"
intelligence.member_reputation
------------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

reputation_score DECIMAL(10,2)

participation_score DECIMAL(10,2)

consistency_score DECIMAL(10,2)

trust_score DECIMAL(10,2)

last_updated TIMESTAMP

created_at TIMESTAMP
```

---

## Example

```text id="v5m8qx"
Victor

Reputation:
92.50

Participation:
95.00

Consistency:
89.00

Trust:
96.00
```

---

## Constraint

```sql id="a2r7pv"
UNIQUE(user_id)
```

---

## Recommended Indexes

```sql id="u9m3qw"
INDEX member_rep_user_idx(user_id)

INDEX member_rep_score_idx(reputation_score)
```

---

# TABLE 2

# intelligence.creator_reputation

## Purpose

Stores creator reputation.

---

## Structure

```sql id="p4r8mx"
intelligence.creator_reputation
--------------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

campaign_score DECIMAL(10,2)

quality_score DECIMAL(10,2)

consistency_score DECIMAL(10,2)

trust_score DECIMAL(10,2)

last_updated TIMESTAMP

created_at TIMESTAMP
```

---

## Example

```text id="r6m2qw"
Purity

Campaign:
90

Quality:
95

Consistency:
88

Trust:
97
```

---

## Constraint

```sql id="f3r9pv"
UNIQUE(user_id)
```

---

## Recommended Indexes

```sql id="w8m4qx"
INDEX creator_rep_user_idx(user_id)

INDEX creator_rep_score_idx(trust_score)
```

---

# TABLE 3

# intelligence.community_reputation

## Purpose

Stores community reputation.

---

## Structure

```sql id="t5r2mx"
intelligence.community_reputation
---------------------------------

id UUID PRIMARY KEY

community_id UUID
REFERENCES identity.member_communities(id)

reputation_score DECIMAL(10,2)

activity_score DECIMAL(10,2)

consistency_score DECIMAL(10,2)

trust_score DECIMAL(10,2)

last_updated TIMESTAMP

created_at TIMESTAMP
```

---

## Example

```text id="x7m8qw"
Community:
M014

Reputation:
94.50

Activity:
92.00

Trust:
97.00
```

---

## Constraint

```sql id="c1r7pv"
UNIQUE(community_id)
```

---

## Recommended Indexes

```sql id="j9m2qx"
INDEX community_rep_idx(community_id)

INDEX community_rep_score_idx(reputation_score)
```

---

# TABLE 4

# intelligence.badges

## Purpose

Stores the badge catalog: reusable badge definitions, decoupled from who holds them. `user_badges` references this table rather than duplicating badge information.

---

## Structure

```sql id="k8m2rx"
intelligence.badges
-------------------

id UUID PRIMARY KEY

badge_name VARCHAR(100) UNIQUE

description TEXT

icon_url TEXT

category VARCHAR(100)

criteria TEXT

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Example Badges

```text id="m8k5qw"
Elite Creator

Trusted Creator

Top Amplified Creator

Consistent Creator

Elite Community

Trusted Community

High Performance Community

Consistent Community
```

---

## Constraint

```sql id="p4k9mx"
UNIQUE(badge_name)
```

---

## Recommended Indexes

```sql id="h2m7pv"
INDEX badges_name_idx(badge_name)

INDEX badges_category_idx(category)
```

---

# TABLE 5

# intelligence.user_badges

## Purpose

Stores badges awarded to users. Badges belong to users, not roles: a single table covers every badge holder, whether the user is acting as a creator, a member, or both. References `intelligence.badges` for the badge definition rather than duplicating badge information.

---

## Structure

```sql id="b5r9qx"
intelligence.user_badges
------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

badge_id UUID
REFERENCES intelligence.badges(id)

awarded_at TIMESTAMP

expires_at TIMESTAMP NULL
```

---

## Recommended Indexes

```sql id="v7r2mx"
INDEX user_badges_user_idx(user_id)

INDEX user_badges_badge_idx(badge_id)
```

---

# TABLE 6

# intelligence.performance_bonus

## Purpose

Stores administrator-approved recognition bonuses.

These are recognition credits and not engagement payments.

---

## Structure

```sql id="d4m7qw"
intelligence.performance_bonus
------------------------------

id UUID PRIMARY KEY

bonus_code VARCHAR(30)

community_id UUID
REFERENCES identity.member_communities(id)

campaign_id UUID
REFERENCES economy.campaigns(id)

bonus_amount INTEGER

reason TEXT

approved_by UUID
REFERENCES identity.users(id)

approved_at TIMESTAMP

created_at TIMESTAMP
```

---

## Example

```text id="u8r2pv"
BON0001

Community:
M014

Bonus:
1000 Credits

Reason:
95% Performance
```

---

## Recommended Indexes

```sql id="g1m9qx"
INDEX performance_bonus_community_idx(community_id)

INDEX performance_bonus_campaign_idx(campaign_id)
```

---

# TABLE 7

# intelligence.performance_bonus_members

## Purpose

Stores bonus allocations to community members.

---

## Structure

```sql id="r5m8qw"
intelligence.performance_bonus_members
--------------------------------------

id UUID PRIMARY KEY

bonus_id UUID
REFERENCES intelligence.performance_bonus(id)

user_id UUID
REFERENCES identity.users(id)

credit_amount INTEGER

credited_at TIMESTAMP
```

---

## Example

```text id="k2r7pv"
Bonus:
BON0001

User:
Victor

Credits:
1000
```

---

## Recommended Indexes

```sql id="y9m3qx"
INDEX performance_bonus_member_idx(user_id)

INDEX performance_bonus_bonus_idx(bonus_id)
```

---

# TABLE 8

# intelligence.achievement_history

## Purpose

Provides a permanent, append-only history of every reputation milestone, badge award, achievement, and recognition event on the platform.

No history is ever deleted.

---

## Structure

```sql id="w3m7qx"
intelligence.achievement_history
--------------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

community_id UUID
REFERENCES identity.member_communities(id)

event_type VARCHAR(50)

reference_id UUID

description TEXT

metadata JSONB

created_at TIMESTAMP
```

---

## Event Types

```text id="ach_event_types"
reputation_milestone

badge_award

achievement

recognition_event
```

---

## Example

```text id="u4m8qx"
User:
Victor

Event:
badge_award

Reference:
Elite Creator

Recorded:
2026-07-08
```

---

## Recommended Indexes

```sql id="n2r8pv"
INDEX achievement_history_user_idx(user_id)

INDEX achievement_history_community_idx(community_id)

INDEX achievement_history_event_type_idx(event_type)

INDEX achievement_history_created_idx(created_at)
```

---

# Intelligence Relationships

```text id="f6r8mx"
identity.users
        ↓
member_reputation

identity.users
        ↓
creator_reputation

member_communities
        ↓
community_reputation

badges
        ↓
user_badges
        ↓
identity.users

member_communities
        ↓
performance_bonus
        ↓
performance_bonus_members

member_reputation, creator_reputation, community_reputation,
user_badges, performance_bonus, performance_bonus_members
        ↓
achievement_history
```

---

# Recognition Philosophy

Recognition means:

```text id="c4m7qw"
Trust

Consistency

Participation

Community Contribution
```

Recognition does not mean:

```text id="t8r2pv"
Payment

Salary

Task Rewards

Engagement Farming
```

Badges belong to users, not roles. A single badge catalog (`badges`) and a single award table (`user_badges`) recognize any user -- acting as creator, member, or both -- without duplicating badge information per role. Every milestone, award, achievement, and recognition event is permanently recorded in `achievement_history`.

---

# Future AI Usage

Remain disabled:

```text id="n3m9qx"
AUTO_BONUS_ENABLED = false

AI_REPUTATION_ENABLED = false

AI_RECOGNITION_ENABLED = false
```

When enabled, AI_RECOGNITION_ENABLED governs AI-assisted badge recommendation from the `badges` catalog and AI-assisted analysis of `achievement_history`. These remain disabled until approved.

---

# RLS Philosophy

Members may:

```text id="p7r2mx"
View own reputation

View own badges

View own bonuses

View own achievement history
```

Creators may:

```text id="x1m8qw"
View own reputation

View own badges

View own achievement history
```

Administrators may:

```text id="v4r7pv"
View and manage everything
```

Badges are user-scoped, not role-scoped: "view own badges" reads `user_badges` filtered to the caller's own `user_id`, the same policy shape for members and creators alike. The `badges` catalog itself is definitional, not personal data, and is not covered by "own" access.

---

# Intelligence Schema Status

```text id="j6m3qx"
intelligence schema

tables:
8

status:
LOCKED
```
