# PCGH Rotation Engine

## Overview

The PCGH Rotation Engine is responsible for ensuring that content distribution remains natural, diverse, community-driven, and resistant to suspicious engagement patterns.

The Rotation Engine prevents PCGH from behaving like:

* Follow-for-follow systems
* Engagement pods
* Click farms
* Reward-based engagement networks
* Artificial amplification networks

Instead, PCGH enforces:

* Community diversification
* Natural exposure patterns
* Cooldown periods
* Anti-repetition mechanisms
* Anti-self exposure protections
* Community performance optimization

---

# Core Philosophy

The purpose of the Rotation Engine is not to restrict distribution.

Its purpose is to ensure that distribution appears natural and healthy while maximizing community participation and creator visibility.

---

# Community Rotation

A creator should not repeatedly distribute content to the same community.

## Incorrect Distribution

```text
Victor
   ↓
M014
   ↓
M014
   ↓
M014
   ↓
M014
```

## Correct Distribution

```text
Victor
   ↓
M014
   ↓
M028
   ↓
M072
   ↓
M145
```

---

# Manual Community Selection (PCGH V1)

In PCGH V1, the administrator manually selects the communities that receive a creator's campaign.

Example:

```text
Campaign:
CMP0001

Selected Communities:

✓ M002
✓ M005
✓ M014
```

This allows the platform to learn community behavior before introducing AI-assisted automation.

---

# Community Cooldowns

Communities may enter a cooldown period after receiving content from a creator.

The cooldown period prevents repetitive exposure.

Example:

```text
Creator:
Victor

Community:
M014

Cooldown:
14 days
```

During the cooldown period, the creator's content cannot be distributed to that community.

---

# Manual Cooldown Controls

PCGH V1 uses administrator-controlled cooldown periods.

## Cooldown Toggle

```text
Enable Cooldown

ON / OFF
```

## Cooldown Duration

The administrator can select any duration between:

```text
1 day
through
31 days
```

Example:

```text
Selected:
28 days
```

---

# Performance-Based Cooldown Decisions

Community performance history is used to determine future cooldown periods.

Example:

```text
Community:
M002

Campaign:
CMP0001

Participation:
89%

Views:
91

Shares:
24

Saves:
12

Performance:
Excellent

Admin Decision:
28-day cooldown
```

Example:

```text
Community:
M005

Campaign:
CMP0002

Participation:
34%

Views:
28

Shares:
2

Saves:
0

Performance:
Poor

Admin Decision:
5-day cooldown
```

---

# Member Cooldowns

Members who recently participated in a creator's campaign may enter a cooldown period.

Example:

```text
Creator:
Victor

Member:
Purity

Cooldown:
14 days
```

This prevents repetitive creator-member exposure patterns.

---

# Anti-Self Exposure Protection

Creators never receive their own campaigns.

Example:

```text
Victor belongs to:

Community:
M014

Victor creates campaign:
CMP0001

Result:

Victor does not receive
his own discovery opportunity.
```

---

# Community Exclusion

Administrators may exclude communities from campaign distribution.

Example:

```text
Community:
M021

Status:
Excluded

Reason:
Suspicious activity detected
```

Excluded communities are ignored by the Distribution Engine.

---

# Community Performance History

PCGH stores historical community performance to assist with future distribution decisions.

Example:

```text
Community:
M014

Creator:
Victor

Campaign:
CMP0001

Members:
100

Viewed:
89

Shared:
21

Saved:
10

Participation:
89%

Performance Score:
91
```

---

# Database Tables

## rotation_history

Tracks previous creator-community distributions.

```text
id

creator_id

campaign_id

community_id

distributed_at

created_at
```

---

## community_cooldowns

Tracks community cooldown periods.

```text
id

creator_id

community_id

cooldown_days

starts_at

expires_at

created_by

reason
```

---

## member_cooldowns

Tracks member cooldown periods.

```text
id

creator_id

member_id

starts_at

expires_at

reason
```

---

## community_exclusions

Tracks excluded communities.

```text
id

community_id

excluded_by

reason

created_at
```

---

## community_performance_history

Stores historical performance data.

```text
id

community_id

creator_id

campaign_id

members_assigned

members_viewed

members_shared

members_saved

participation_rate

performance_score

created_at
```

---

# Rotation Flow

```text
Creator
     ↓
Campaign
     ↓
Distribution Engine
     ↓
Rotation Engine

Checks:

✓ Previous distributions
✓ Community cooldowns
✓ Member cooldowns
✓ Community performance
✓ Anti-self exposure
✓ Community exclusions

     ↓

Approved Communities
```

---

# Future Feature Flags

```json
{
  "AUTO_COOLDOWN_ENABLED": false,
  "SELECTIVE_ASSIGNMENT_ENABLED": false,
  "AI_ROTATION_ENABLED": false
}
```

---

# Future Roadmap

As PCGH grows, the Rotation Engine may evolve to support:

* Automatic cooldown calculations
* AI-assisted rotation decisions
* Predictive community performance
* Dynamic distribution optimization
* Intelligent audience diversification

Until then, PCGH V1 uses administrator-guided rotation management to ensure quality and platform health.

