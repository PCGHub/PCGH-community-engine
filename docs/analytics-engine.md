# PCGH Analytics Engine

## Overview

The Analytics Engine is the intelligence and monitoring system of PCGH.

It provides analytics at four levels:

* Member Analytics
* Community Analytics
* Creator Analytics
* Platform Analytics

---

# Member Analytics

Measures member participation.

## member_analytics

```text
id

user_id

discoveries_received

discoveries_viewed

discoveries_visited

discoveries_shared

discoveries_saved

participation_rate

updated_at
```

---

# Community Analytics

Measures community health and amplification.

## community_analytics

```text
id

community_id

total_members

active_members

participation_rate

total_views

total_shares

total_saves

amplification_score

updated_at
```

---

# Creator Analytics

Measures creator performance.

## creator_analytics

```text
id

creator_id

campaigns

credits_spent

total_reach

total_views

total_shares

total_saves

amplification_score

updated_at
```

---

# Platform Analytics

Measures overall platform health.

## platform_analytics

```text
id

total_creators

total_members

total_communities

total_creator_circles

total_campaigns

total_discoveries

participation_rate

platform_health

updated_at
```

---

# Event Tracking

Every significant action generates an analytics event.

## analytics_events

```text
id

user_id

campaign_id

community_id

event_type

metadata

created_at
```

---

## Event Types

* discovery_received
* discovery_viewed
* discovery_visited
* discovery_shared
* discovery_saved
* campaign_created
* campaign_completed
* bonus_awarded

---

# Analytics Reports

## analytics_reports

```text
id

report_type

generated_by

report_data

created_at
```

---

# Dashboard Levels

## Member Dashboard

Shows:

* Participation
* Standing
* Badges

---

## Community Dashboard

Shows:

* Participation
* Amplification
* Reputation
* Badges

---

## Creator Dashboard

Shows:

* Campaign performance
* Reach
* Amplification
* Standing

---

## Admin Dashboard

Shows:

* Platform health
* Creator performance
* Community performance
* Member performance
* Analytics reports

---

# Analytics Engine Features

* Member Analytics
* Community Analytics
* Creator Analytics
* Platform Analytics
* Event Tracking
* Reporting
* Amplification Analytics
* Platform Health Monitoring

```
```

