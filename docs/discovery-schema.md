# PCGH Discovery Schema

## Schema

```text id="q8r2mv"
discovery
```

## Status

LOCKED

## Phase

Phase 2 — Implementation

---

# Purpose

The Discovery Schema transforms creator campaigns into community discovery opportunities.

This schema represents the primary intellectual property of PCGH.

PCGH does not assign tasks.

PCGH creates discovery opportunities.

---

# Discovery Philosophy

Traditional platforms operate as:

```text id="k4m8qw"
Task
     ↓
Reward
     ↓
Engagement
```

PCGH operates as:

```text id="v6r2px"
Campaign
      ↓
Discovery
      ↓
Community
      ↓
Amplification
```

---

# Tables

```text id="p9m4qx"
discovery.discovery_opportunities

discovery.community_assignments

discovery.member_assignments

discovery.assignment_history
```

---

# TABLE 1

# discovery.discovery_opportunities

## Purpose

Stores discovery opportunities created from campaigns.

---

## Structure

```sql id="g2r8mv"
## Structure

```sql
discovery.discovery_opportunities
---------------------------------

id UUID PRIMARY KEY

opportunity_code VARCHAR(30) UNIQUE

campaign_id UUID
REFERENCES economy.campaigns(id)

creator_id UUID
REFERENCES identity.users(id)

campaign_type VARCHAR(50)

title VARCHAR(255)

description TEXT

content_url TEXT

platform VARCHAR(50)

content_type VARCHAR(50)

status VARCHAR(50)

starts_at TIMESTAMP

expires_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Campaign Types

```text
creator

business

ministry

organization

educational
```

---

## Status

```text id="u3m7qw"
draft

scheduled

active

expired

archived
```

---

## Example

```text id="h9k2pv"
DOP0001

Campaign:
CMP0001

Creator:
Victor

Platform:
YouTube
```

---

## Recommended Indexes

```sql id="w5r8mx"
INDEX opportunity_campaign_idx(campaign_id)

INDEX opportunity_creator_idx(creator_id)

INDEX opportunity_status_idx(status)

INDEX opportunity_created_idx(created_at)
```

---

# TABLE 2

# discovery.community_assignments

## Purpose

Assigns discovery opportunities to communities.

---

## Structure

```sql id="j4m9qx"
discovery.community_assignments
-------------------------------

id UUID PRIMARY KEY

opportunity_id UUID
REFERENCES discovery.discovery_opportunities(id)

community_id UUID
REFERENCES identity.member_communities(id)

members_assigned INTEGER DEFAULT 0

members_viewed INTEGER DEFAULT 0

members_shared INTEGER DEFAULT 0

members_saved INTEGER DEFAULT 0

performance_score DECIMAL(5,2)

assigned_at TIMESTAMP

status VARCHAR(50)
```

---

## Status

```text id="t7r2mv"
assigned

active

completed

expired

cancelled
```

---

## Example

```text id="m8k5qw"
Opportunity:
DOP0001

Community:
M014

Members:
100
```

---

## Recommended Indexes

```sql id="c3r7px"
INDEX community_assignment_opportunity_idx(opportunity_id)

INDEX community_assignment_community_idx(community_id)

INDEX community_assignment_status_idx(status)
```

---

# TABLE 3

# discovery.member_assignments

## Purpose

Tracks discovery opportunities delivered to members.

---

## Structure

```sql
discovery.member_assignments
----------------------------

id UUID PRIMARY KEY

opportunity_id UUID
REFERENCES discovery.discovery_opportunities(id)

community_id UUID
REFERENCES identity.member_communities(id)

user_id UUID
REFERENCES identity.users(id)

assigned_at TIMESTAMP

viewed_at TIMESTAMP

visited_at TIMESTAMP

shared_at TIMESTAMP

saved_at TIMESTAMP

ignored_at TIMESTAMP

completed_at TIMESTAMP

status VARCHAR(50)
```

---

## Status

```text
assigned

viewed

visited

shared

saved

ignored

completed

expired
```

---

## Example

```text
Victor

Opportunity:
DOP0001

Status:
Viewed
```

---

## Recommended Indexes

```sql
INDEX member_assignment_user_idx(user_id)

INDEX member_assignment_community_idx(community_id)

INDEX member_assignment_opportunity_idx(opportunity_id)

INDEX member_assignment_status_idx(status)
```

---

# TABLE 4

# discovery.assignment_history

## Purpose

Provides a permanent audit trail for discovery activities.

No history is ever deleted.

---

## Structure

```sql id="p2r8mv"
discovery.assignment_history
----------------------------

id UUID PRIMARY KEY

opportunity_id UUID
REFERENCES discovery.discovery_opportunities(id)

community_id UUID
REFERENCES identity.member_communities(id)

user_id UUID
REFERENCES identity.users(id)

action VARCHAR(50)

metadata JSONB

created_at TIMESTAMP
```

---

## Actions

```text id="q4m7px"
## Actions

```text
received

viewed

visited

shared

saved

ignored

completed
```


---

## Example

```text id="u9k2qw"
User:
Victor

Opportunity:
DOP0001

Action:
Viewed
```

---

## Recommended Indexes

```sql id="n3r8mx"
INDEX assignment_history_user_idx(user_id)

INDEX assignment_history_opportunity_idx(opportunity_id)

INDEX assignment_history_action_idx(action)

INDEX assignment_history_created_idx(created_at)
```

---

# Discovery Relationships

```text id="f7m4qw"
economy.campaigns
          ↓
discovery_opportunities
          ↓
community_assignments
          ↓
member_assignments
          ↓
assignment_history
```

---

# Discovery Rules

PCGH distributes:

```text id="j8r2mv"
Discovery

Visibility

Audience Exposure
```

PCGH never distributes:

```text id="x5m9qx"
Tasks

Jobs

Payments

Guaranteed Engagement
```

---

# Community Rule

In PCGH V1:

```text id="w2k7pv"
One assigned community

=
All members receive
the discovery opportunity
```

Example:

```text id="r6m3qw"
M014

100 Members

↓

100 Discovery Assignments
```

---

# Future Features

The following remain disabled:

```text id="b9r2mx"
SELECTIVE_ASSIGNMENT_ENABLED = false

AI_AUDIENCE_MATCHING_ENABLED = false

AI_DISCOVERY_OPTIMIZATION_ENABLED = false
```

---

# RLS Philosophy

Members may:

```text id="h4m8qw"
View own assignments

View own discovery history
```

Creators may:

```text id="p7r2mv"
View own campaign discoveries

View own analytics
```

Administrators may:

```text id="v1k9qx"
View everything
```

---

# Discovery Schema Status

```text
discovery schema

tables:
4

completeness:
100%

status:
FINAL
```

This schema represents the core intellectual property of the PCGH platform.

