# PCGH Discovery Assignment Engine

## Overview

The Discovery Assignment Engine is the core intellectual property of the PCGH platform.

Its purpose is to transform creator campaigns into structured community discovery opportunities.

PCGH does not assign tasks.

PCGH creates discovery opportunities.

---

# Discovery Philosophy

Traditional engagement systems operate as:

```text id="ky4g3m"
Task
    ↓
Reward
    ↓
Engagement
```

PCGH operates as:

```text id="b7m9qc"
Discovery
     ↓
Community
     ↓
Amplification
```

Members are not required to perform actions.

Members receive opportunities to:

* Discover
* Watch
* Visit
* Save
* Share
* Support

if they find value.

---

# Discovery Flow

```text id="j8p2rt"
Creator
     ↓
Campaign
     ↓
Discovery Opportunity
     ↓
Community Assignment
     ↓
Member Assignment
     ↓
Audience Amplification
     ↓
Analytics
```

---

# Discovery Opportunity Lifecycle

A discovery opportunity progresses through the following stages:

```text id="n5q8wv"
draft

scheduled

active

expired

archived
```

Discovery opportunities are never deleted.

Historical discovery data remains available for:

* Analytics
* Reputation
* Recognition
* Community history
* Creator history

---

# Discovery Opportunities

The discovery opportunity is the master discovery record.

## discovery_opportunities

```text id="t6m3hy"
id

opportunity_code

campaign_id

creator_id

title

description

content_url

platform

content_type

status

starts_at

expires_at

created_at

updated_at
```

---

# Example

```text id="v9k1px"
Opportunity:
DOP0001

Campaign:
CMP0001

Creator:
Victor

Platform:
YouTube
```

---

# Community Assignment

Discovery opportunities are assigned to communities.

## community_assignments

```text id="e4r7qs"
id

opportunity_id

community_id

members_assigned

members_viewed

members_shared

members_saved

assigned_at

status
```

---

# Community Assignment Philosophy

In PCGH V1:

```text id="u7w4jn"
Every member
inside an assigned community
receives the discovery opportunity.
```

Example:

```text id="d3m8zk"
Community:
M014

Members:
100

Result:

100 members receive
the discovery opportunity.
```

---

# Member Assignment

Every assigned member receives a discovery opportunity.

## member_assignments

```text id="q2p9hx"
id

opportunity_id

community_id

user_id

assigned_at

viewed_at

visited_at

shared_at

saved_at

completed_at

status
```

---

# Assignment History

Assignment history creates the audit trail.

## assignment_history

```text id="r5v1my"
id

opportunity_id

community_id

user_id

action

metadata

created_at
```

---

# Example Actions

```text id="z8k4rt"
received

viewed

visited

shared

saved

completed
```

---

# Discovery History

Discovery opportunities remain available after expiration.

Example:

```text id="m4j7qw"
Today's Discoveries
          ↓
Expired
          ↓
Discovery History
```

Discovery history supports:

* Member history
* Community history
* Creator history
* Analytics
* Reputation
* Recognition

---

# Community View

Members see:

```text id="p1w9hn"
Today's Discoveries

Suggested:

• Watch
• Visit
• Share if valuable
```

Members do not see:

```text id="s6r2mv"
Tasks

Required actions

Payment instructions
```

---

# Creator View

Creators see:

```text id="u3m8yx"
Campaign:
CMP0001

Discovery:
DOP0001

Communities:
3

Members:
300

Participation:
81%
```

---

# Administrative View

Administrators see:

```text id="v5q7pn"
Campaign:
CMP0001

Discovery:
DOP0001

Communities:
M014
M028
M072

Members:
300

Views:
245

Shares:
42

Saves:
18
```

---

# Discovery Assignment Philosophy

PCGH distributes:

* Discovery
* Visibility
* Audience exposure

PCGH does not distribute:

* Tasks
* Jobs
* Rewards
* Paid engagement

---

# Future Evolution

Future versions of PCGH may support:

* Selective assignment
* AI audience matching
* AI discovery optimization
* Predictive amplification

These features remain disabled in PCGH V1.

Example:

```json id="w2k6jb"
{
  "SELECTIVE_ASSIGNMENT_ENABLED": false,
  "AI_AUDIENCE_MATCHING_ENABLED": false,
  "AI_DISCOVERY_OPTIMIZATION_ENABLED": false
}
```

---

# Core Philosophy

The Discovery Assignment Engine transforms:

```text id="g9m4vr"
Creator Content
        ↓
Discovery
        ↓
Community
        ↓
Amplification
```

This engine represents the core intellectual property of the PCGH platform.
