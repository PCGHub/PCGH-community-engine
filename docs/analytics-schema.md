# PCGH Analytics Schema

## Schema

```text id="r8k2pv"
analytics
```

## Status

LOCKED

## Phase

Phase 2 — Implementation

---

# Purpose

The Analytics Schema stores all measurable activity across the PCGH ecosystem.

It supports:

* creator analytics
* member analytics
* community analytics
* platform analytics
* event tracking
* reporting

The Analytics Schema provides the intelligence required for future AI systems.

---

# Analytics Philosophy

PCGH measures:

* discovery
* visibility
* participation
* amplification
* consistency
* platform health

PCGH does not measure:

* paid engagement
* engagement farming
* task completion rewards

---

# Tables

```text id="m6r9qw"
analytics.member_analytics

analytics.community_analytics

analytics.creator_analytics

analytics.platform_analytics

analytics.analytics_events

analytics.analytics_reports
```

---

# TABLE 1

# analytics.member_analytics

## Purpose

Stores aggregated member performance.

---

## Structure

```sql id="a5m8pv"
analytics.member_analytics
--------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

discoveries_received INTEGER DEFAULT 0

discoveries_viewed INTEGER DEFAULT 0

discoveries_shared INTEGER DEFAULT 0

discoveries_saved INTEGER DEFAULT 0

participation_rate DECIMAL(10,2)

last_updated TIMESTAMP
```

---

## Example

```text id="q3r7mx"
Victor

Received:
250

Viewed:
220

Shared:
40

Saved:
18

Participation:
88%
```

---

## Constraint

```sql id="n8m2qw"
UNIQUE(user_id)
```

---

## Recommended Indexes

```sql id="t4r9pv"
INDEX member_analytics_user_idx(user_id)

INDEX member_analytics_participation_idx(participation_rate)
```

---

# TABLE 2

# analytics.community_analytics

## Purpose

Stores aggregated community performance.

---

## Structure

```sql id="g7m3qx"
analytics.community_analytics
-----------------------------

id UUID PRIMARY KEY

community_id UUID
REFERENCES identity.member_communities(id)

campaigns_received INTEGER DEFAULT 0

discoveries_viewed INTEGER DEFAULT 0

discoveries_shared INTEGER DEFAULT 0

discoveries_saved INTEGER DEFAULT 0

participation_rate DECIMAL(10,2)

last_updated TIMESTAMP
```

---

## Example

```text id="u1r8mx"
Community:
M014

Campaigns:
45

Participation:
95%
```

---

## Constraint

```sql id="w5m7qw"
UNIQUE(community_id)
```

---

## Recommended Indexes

```sql id="j2r4pv"
INDEX community_analytics_idx(community_id)

INDEX community_analytics_participation_idx(participation_rate)
```

---

# TABLE 3

# analytics.creator_analytics

## Purpose

Stores creator performance metrics.

---

## Structure

```sql id="p8m9qx"
analytics.creator_analytics
---------------------------

id UUID PRIMARY KEY

creator_id UUID
REFERENCES identity.users(id)

campaigns_created INTEGER DEFAULT 0

communities_reached INTEGER DEFAULT 0

members_reached INTEGER DEFAULT 0

views_generated INTEGER DEFAULT 0

shares_generated INTEGER DEFAULT 0

saves_generated INTEGER DEFAULT 0

amplification_score DECIMAL(10,2)

last_updated TIMESTAMP
```

---

## Example

```text id="r6m2pv"
Victor

Campaigns:
25

Communities:
120

Members:
12000

Amplification:
91%
```

---

## Constraint

```sql id="f3r8qw"
UNIQUE(creator_id)
```

---

## Recommended Indexes

```sql id="v9m4qx"
INDEX creator_analytics_idx(creator_id)

INDEX creator_amplification_idx(amplification_score)
```

---

# TABLE 4

# analytics.platform_analytics

## Purpose

Stores platform-wide metrics.

---

## Structure

```sql id="b4r7mx"
analytics.platform_analytics
----------------------------

id UUID PRIMARY KEY

metric_name VARCHAR(100)

metric_value BIGINT

recorded_at TIMESTAMP
```

---

## Example Metrics

```text id="h8m3qw"
TOTAL_USERS

TOTAL_CREATORS

TOTAL_COMMUNITIES

TOTAL_CAMPAIGNS

TOTAL_DISCOVERIES

TOTAL_AMPLIFICATIONS
```

---

## Recommended Indexes

```sql id="m2r9pv"
INDEX platform_metric_idx(metric_name)

INDEX platform_recorded_idx(recorded_at)
```

---

# TABLE 5

# analytics.analytics_events

## Purpose

Stores platform events.

This table becomes the future AI and analytics foundation.

---

## Structure

```sql id="t7m8qx"
analytics.analytics_events
--------------------------

id UUID PRIMARY KEY

event_type VARCHAR(100)

user_id UUID
REFERENCES identity.users(id)

entity_type VARCHAR(100)

entity_id UUID

metadata JSONB

created_at TIMESTAMP
```

---

## Example Events

```text id="k5r2mx"
USER_CREATED

CAMPAIGN_CREATED

DISCOVERY_ASSIGNED

DISCOVERY_VIEWED

DISCOVERY_SHARED

BONUS_GRANTED

BADGE_AWARDED
```

---

## Recommended Indexes

```sql id="n1m7qw"
INDEX analytics_event_type_idx(event_type)

INDEX analytics_event_user_idx(user_id)

INDEX analytics_event_created_idx(created_at)
```

---

# TABLE 6

# analytics.analytics_reports

## Purpose

Stores generated reports.

---

## Structure

```sql id="c8r4pv"
analytics.analytics_reports
---------------------------

id UUID PRIMARY KEY

report_name VARCHAR(255)

report_type VARCHAR(100)

generated_by UUID
REFERENCES identity.users(id)

report_data JSONB

created_at TIMESTAMP
```

---

## Example Reports

```text id="d6m9qx"
Community Performance

Creator Performance

Campaign Performance

Monthly Platform Report

Recognition Report
```

---

## Recommended Indexes

```sql id="g3r8mx"
INDEX analytics_report_type_idx(report_type)

INDEX analytics_report_creator_idx(generated_by)
```

---

# Analytics Relationships

```text id="u7m4qw"
identity.users
        ↓
member_analytics

identity.member_communities
        ↓
community_analytics

identity.users
        ↓
creator_analytics

analytics_events
        ↓
analytics_reports
```

---

# Event Philosophy

Everything important creates an event.

Examples:

```text id="x2r7pv"
Campaign Created

Discovery Assigned

Discovery Viewed

Bonus Granted

Badge Awarded

Cooldown Created
```

---

# Future Features

Remain disabled:

```text id="q9m3qx"
AI_ANALYTICS_ENABLED = false

PREDICTIVE_ANALYTICS_ENABLED = false

AI_OPTIMIZATION_ENABLED = false
```

---

# RLS Philosophy

Members may:

```text id="a4r8mx"
View own analytics
```

Creators may:

```text id="w8m2qw"
View own analytics
```

Administrators may:

```text id="t5r7pv"
View all analytics
```

---

# Partitioning Strategy

Future partitioning candidates:

```text id="j7m9qx"
analytics_events

analytics_reports

platform_analytics
```

Partition strategy:

```sql id="v3r4mx"
PARTITION BY RANGE(created_at)
```

---

# Analytics Schema Status

```text id="k6m8qw"
analytics schema

tables:
6

status:
LOCKED
```

The Analytics Schema becomes the measurement and intelligence foundation of the PCGH operating system.
