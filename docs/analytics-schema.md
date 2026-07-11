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

created_at TIMESTAMP
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

INDEX member_analytics_created_idx(created_at)
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

created_at TIMESTAMP
```

Sourced from `discovery.community_assignments` (assignment-level counters) and `protection.community_performance_history` (per-campaign performance snapshots). This table is the current-state rollup; the two source tables remain the historical, per-assignment and per-campaign record of truth.

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

INDEX community_analytics_created_idx(created_at)
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

created_at TIMESTAMP
```

Sourced from `economy.campaigns` (campaigns_created) and `discovery.discovery_opportunities` / `discovery.community_assignments` (communities_reached, members_reached, views/shares/saves generated). No direct foreign key to a single campaign — this table aggregates across all of a creator's campaigns, so lineage is by `creator_id`, not by `campaign_id`.

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

INDEX creator_analytics_created_idx(created_at)
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

created_at TIMESTAMP
```

`recorded_at` is the metric's as-of timestamp (may be backfilled); `created_at` is when the row was written, per platform-wide convention.

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

INDEX platform_analytics_created_idx(created_at)
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

## Event Types

`event_type` is a governed vocabulary, not a free-text field. Initial approved values:

```text id="k5r2mx"
USER_CREATED

CAMPAIGN_CREATED

DISCOVERY_ASSIGNED

DISCOVERY_VIEWED

DISCOVERY_SHARED

BONUS_GRANTED

BADGE_AWARDED
```

New event types must be added to this list before being emitted. This keeps `event_type` usable as a stable feature for future AI/analytics consumers instead of drifting into an ungoverned free-text space, matching the pattern used by `discovery.assignment_history.action` and `intelligence.achievement_history.event_type`.

`analytics_events` is the platform-wide superset log — it records all measurable platform activity, including events with no recognition value (`DISCOVERY_VIEWED`, `DISCOVERY_SHARED`). `intelligence.achievement_history` is a narrower, user-facing log limited to reputation/badge/achievement/recognition events. The two are not duplicates: every event recorded in `achievement_history` is also expected to have a corresponding `analytics_events` row (e.g. `BADGE_AWARDED`), but most `analytics_events` rows have no `achievement_history` counterpart.

---

## Recommended Indexes

```sql id="n1m7qw"
INDEX analytics_event_type_idx(event_type)

INDEX analytics_event_user_idx(user_id)

INDEX analytics_event_created_idx(created_at)

INDEX analytics_event_entity_idx(entity_type, entity_id)
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

Analytics is a rollup layer, not a primary source of data. Every aggregate table here is derived from an upstream schema, which remains the record of truth:

```text id="u7m4qw"
identity.users
        ↓
member_analytics
        ↑
discovery.member_assignments

identity.member_communities
        ↓
community_analytics
        ↑
discovery.community_assignments, protection.community_performance_history

identity.users
        ↓
creator_analytics
        ↑
economy.campaigns, discovery.discovery_opportunities

analytics_events
        ↓
analytics_reports

governance.feature_flags, governance.ai_controls
        ↓
analytics (AI / predictive feature gating)
```

Analytics does not duplicate Intelligence's reputation or badge scoring (`intelligence.member_reputation`, `creator_reputation`, `community_reputation`, `badges`, `user_badges`) — those remain owned by the Intelligence Schema. Analytics may consume them for reporting but is not their source.

`analytics.creator_analytics`, `analytics.community_analytics`, and `analytics.platform_analytics` are the intended persistence layer behind the API Schema's future materialized view candidates (`creator_statistics_mv`, `community_statistics_mv`, `daily_platform_statistics_mv`). Those views should read from these tables rather than re-aggregating source schemas independently, to avoid building the same rollup twice.

Materialized Views are implementation optimizations only. They improve query performance but never replace the Analytics Schema as the authoritative reporting layer.

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

AI and predictive analytics features are not declared locally. They are owned by the Governance Schema:

```text id="q9m3qx"
governance.feature_flags -> AI_ANALYTICS_ENABLED

governance.ai_controls -> AI_ANALYTICS
```

Additional predictive/optimization features (e.g. predictive analytics, AI-driven optimization) must be registered as new rows in `governance.feature_flags` and `governance.ai_controls` before use, not as flags local to this schema. All remain disabled by default.

---

# RLS Philosophy

`member_analytics` and `creator_analytics` are personal, per-user rollups:

Members may:

```text id="a4r8mx"
View own analytics (member_analytics)
```

Creators may:

```text id="w8m2qw"
View own analytics (creator_analytics)
```

`community_analytics` is community-scoped, not personal. Consistent with the Protection Schema's philosophy of restricting community-wide performance data from ordinary members:

Administrators may:

```text id="community_analytics_rls_admin"
View all community analytics
```

Creators may:

```text id="community_analytics_rls_creator"
View analytics only for communities participating in their own campaigns
```

Members may:

```text id="community_analytics_rls_member"
No direct access
```

Future Community Managers may:

```text id="community_analytics_rls_manager"
View analytics for communities they manage
```

`platform_analytics` and `analytics_events` are platform-wide aggregates and raw behavioral data. Consistent with the Protection Schema's precedent of restricting sensitive cross-user tables to administrators only:

Administrators may:

```text id="t5r7pv"
View all analytics, including platform_analytics and analytics_events
```

Members and creators may not:

```text id="analytics_events_restrict"
Query platform_analytics or analytics_events directly
```

`analytics_reports` may be viewed by the user who generated it (`generated_by`) and by administrators:

```text id="analytics_reports_rls"
Generated_by user: view own reports

Administrators: view all reports
```

Analytics tables are written by service-role aggregation jobs, not by end users. No role other than the service role and administrators may INSERT or UPDATE any table in this schema.

---

# Partitioning Strategy

Future partitioning candidates — all append-only, unbounded-growth tables:

```text id="j7m9qx"
analytics_events

analytics_reports

platform_analytics
```

Partition strategy:

```sql id="v3r4mx"
PARTITION BY RANGE(created_at)
```

`member_analytics`, `community_analytics`, and `creator_analytics` are excluded from partitioning: each is a single-row-per-entity rollup (enforced by a `UNIQUE` constraint), not an append-only log, so range partitioning by time does not apply.

Retention and partitioning for `analytics_events` should be planned alongside `intelligence.achievement_history`, since the two logs overlap in the recognition-event subset described in Event Philosophy — the two should not diverge on retention window without a documented reason.

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
