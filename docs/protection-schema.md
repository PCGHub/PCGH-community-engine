# PCGH Protection Schema

## Schema

```text id="v4r7pw"
protection
```

## Status

LOCKED

## Phase

Phase 2 — Implementation

---

# Purpose

The Protection Schema protects the integrity of the PCGH platform.

It prevents:

* repetitive exposure
* community fatigue
* creator overexposure
* artificial amplification
* suspicious patterns
* self exposure

The Protection Schema is the anti-engagement-farm engine of PCGH.

---

# Protection Philosophy

PCGH protects:

```text id="n7m3qx"
Authenticity

Natural Discovery

Community Health

Audience Diversity
```

PCGH prevents:

```text id="x2r8pv"
Spam

Farming

Repetition

Artificial Exposure
```

---

# Tables

```text id="f5k7qw"
protection.rotation_history

protection.community_cooldowns

protection.member_cooldowns

protection.community_exclusions

protection.community_performance_history
```

---

# TABLE 1

# protection.rotation_history

## Purpose

Stores every creator-to-community exposure.

No records are ever deleted.

---

## Structure

## Structure

```sql id="k3m9rx"
protection.rotation_history
---------------------------

id UUID PRIMARY KEY

creator_id UUID
REFERENCES identity.users(id)

campaign_id UUID
REFERENCES economy.campaigns(id)

community_id UUID
REFERENCES identity.member_communities(id)

rotation_reason VARCHAR(100)

distributed_at TIMESTAMP

cooldown_until TIMESTAMP

created_at TIMESTAMP
```


## Rotation Reasons

```text id="rot_reason"
campaign_distribution

manual_distribution

bonus_distribution

retry_distribution

administrative_override
```

---

## Example

Creator:
Victor

Campaign:
CMP0001

Community:
M014

Reason:
campaign_distribution

Distributed:
2026-07-01

Cooldown:
2026-07-31
```

---

## Recommended Indexes

```sql id="a5m7qw"
INDEX rotation_creator_idx(creator_id)

INDEX rotation_campaign_idx(campaign_id)

INDEX rotation_community_idx(community_id)

INDEX rotation_cooldown_idx(cooldown_until)
```

---

# TABLE 2

# protection.community_cooldowns

## Purpose

Stores cooldown periods for creator-community relationships.

---

## Structure

```sql id="j2r8px"
protection.community_cooldowns
------------------------------

id UUID PRIMARY KEY

creator_id UUID
REFERENCES identity.users(id)

community_id UUID
REFERENCES identity.member_communities(id)

cooldown_days INTEGER

starts_at TIMESTAMP

ends_at TIMESTAMP

created_by UUID
REFERENCES identity.users(id)

created_at TIMESTAMP
```

---

## Rules

```text id="m6k9qw"
Minimum:
1 day

Maximum:
31 days

Administrator controlled:
YES
```

---

## Example

```text id="u3r7mv"
Victor

Community:
M014

Cooldown:
14 Days
```

---

## Recommended Indexes

```sql id="w9m2qx"
INDEX community_cooldown_creator_idx(creator_id)

INDEX community_cooldown_community_idx(community_id)

INDEX community_cooldown_end_idx(ends_at)
```

---

# TABLE 3

# protection.member_cooldowns

## Purpose

Prevents repeated exposure between creators and members.

---

## Structure

```sql id="g4r8pw"
protection.member_cooldowns
---------------------------

id UUID PRIMARY KEY

creator_id UUID
REFERENCES identity.users(id)

member_id UUID
REFERENCES identity.users(id)

community_id UUID
REFERENCES identity.member_communities(id)

cooldown_days INTEGER

starts_at TIMESTAMP

ends_at TIMESTAMP

created_at TIMESTAMP
```

---

## Example

```text id="k7m3qx"
Creator:
Victor

Member:
Purity

Community:
M014

Cooldown:
30 Days
```

---

## Recommended Indexes

```sql id="z5r2mv"
INDEX member_cooldown_creator_idx(creator_id)

INDEX member_cooldown_member_idx(member_id)

INDEX member_cooldown_end_idx(ends_at)
```

---

# TABLE 4

# protection.community_exclusions

## Purpose

Allows communities to be excluded from creator distribution.

---

## Structure

## Structure

```sql id="r8k4qw"
protection.community_exclusions
-------------------------------

id UUID PRIMARY KEY

creator_id UUID
REFERENCES identity.users(id)

community_id UUID
REFERENCES identity.member_communities(id)

reason TEXT

expires_at TIMESTAMP NULL

created_by UUID
REFERENCES identity.users(id)

created_at TIMESTAMP
```


## Exclusion Types

```text
Permanent Exclusion

Temporary Exclusion
```

Example:

```text
Exclude Community M014
for 60 days
```

---

## Example

```text id="h1m7pv"
Creator:
Victor

Excluded:
M014

Reason:
Manual exclusion

Expires:
2026-09-01
```
---

## Recommended Indexes

```sql id="n4r9qx"
INDEX exclusion_creator_idx(creator_id)

INDEX exclusion_community_idx(community_id)
```

---

# TABLE 5

# protection.community_performance_history

## Purpose

Stores historical community performance.

This information helps administrators decide:

* cooldown periods
* distribution timing
* recognition
* bonus allocation

---

## Structure

## Structure

```sql id="q7m2pw"
protection.community_performance_history
----------------------------------------

id UUID PRIMARY KEY

community_id UUID
REFERENCES identity.member_communities(id)

campaign_id UUID
REFERENCES economy.campaigns(id)

members_assigned INTEGER

members_viewed INTEGER

members_shared INTEGER

members_saved INTEGER

engagement_rate DECIMAL(5,2)

performance_score DECIMAL(5,2)

recorded_at TIMESTAMP
```

---

## Example

```text
Community:
M014

Assigned:
100

Viewed:
95

Shared:
22

Saved:
13

Engagement:
35.00

Performance:
95.00
```


---

## Recommended Indexes

```sql id="p6k7qw"
INDEX performance_community_idx(community_id)

INDEX performance_campaign_idx(campaign_id)

INDEX performance_score_idx(performance_score)

INDEX performance_recorded_idx(recorded_at)
```

---

# Protection Relationships

```text id="f9m4qx"
identity.users
         ↓
rotation_history
         ↓
community_cooldowns
         ↓
member_cooldowns
         ↓
community_exclusions
         ↓
community_performance_history
```

---

# Administrative Controls

Administrators may:

```text id="t2r8pv"
Set cooldown days

Ignore cooldowns

Exclude communities

Restore communities

Review performance history
```

---

# Future Features

The following remain disabled:

```text id="j5m7qw"
AI_ROTATION_ENABLED = false

AUTO_COOLDOWN_ENABLED = false

AI_COOLDOWN_OPTIMIZATION_ENABLED = false
```

---

# Protection Philosophy

PCGH protects:

```text id="c8r2mx"
Communities

Creators

Members

Platform Trust
```

The purpose of the Protection Engine is to ensure that audience amplification remains natural and sustainable.

---

# Protection Schema Status

```text id="u1m9qx"
protection schema

tables:
5

completeness:
100%

status:
FINAL
```

