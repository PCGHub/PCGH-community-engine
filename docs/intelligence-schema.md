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

intelligence.creator_badges

intelligence.community_badges

intelligence.performance_bonus

intelligence.performance_bonus_members
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

# intelligence.creator_badges

## Purpose

Stores creator recognition badges.

---

## Structure

```sql id="n4r8mx"
intelligence.creator_badges
---------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

badge_name VARCHAR(100)

badge_type VARCHAR(100)

awarded_at TIMESTAMP

expires_at TIMESTAMP NULL
```

---

## Example Badges

```text id="m8k5qw"
Elite Creator

Trusted Creator

Top Amplified Creator

Consistent Creator
```

---

## Recommended Indexes

```sql id="h2m7pv"
INDEX creator_badges_user_idx(user_id)

INDEX creator_badges_name_idx(badge_name)
```

---

# TABLE 5

# intelligence.community_badges

## Purpose

Stores community recognition badges.

---

## Structure

```sql id="b5r9qx"
intelligence.community_badges
-----------------------------

id UUID PRIMARY KEY

community_id UUID
REFERENCES identity.member_communities(id)

badge_name VARCHAR(100)

badge_type VARCHAR(100)

awarded_at TIMESTAMP

expires_at TIMESTAMP NULL
```

---

## Example Badges

```text id="q3m8pv"
Elite Community

Trusted Community

High Performance Community

Consistent Community
```

---

## Recommended Indexes

```sql id="v7r2mx"
INDEX community_badges_idx(community_id)

INDEX community_badges_name_idx(badge_name)
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
        ↓
community_badges
        ↓
performance_bonus
        ↓
performance_bonus_members
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

---

# Future Features

Remain disabled:

```text id="n3m9qx"
AUTO_BONUS_ENABLED = false

AI_REPUTATION_ENABLED = false

AI_RECOGNITION_ENABLED = false
```

---

# RLS Philosophy

Members may:

```text id="p7r2mx"
View own reputation

View own badges

View own bonuses
```

Creators may:

```text id="x1m8qw"
View own reputation

View own badges
```

Administrators may:

```text id="v4r7pv"
View and manage everything
```

---

# Intelligence Schema Status

```text id="j6m3qx"
intelligence schema

tables:
7

status:
LOCKED
```
