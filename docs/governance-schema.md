# PCGH Governance Schema

## Schema

```text id="r4k8pv"
governance
```

## Status

LOCKED

## Phase

Phase 2 — Implementation

---

# Purpose

The Governance Schema controls:

* platform evolution
* feature management
* administrative overrides
* experimentation
* artificial intelligence controls
* platform configuration

The Governance Schema ensures that PCGH can evolve without requiring database redesign.

---

# Governance Philosophy

PCGH evolves through:

* configuration
* feature flags
* experimentation
* controlled activation

PCGH does not evolve through:

* uncontrolled deployments
* direct database changes
* silent feature releases

---

# Tables

```text id="m7r3qw"
governance.feature_flags

governance.system_settings

governance.governance_rules

governance.admin_overrides

governance.platform_experiments

governance.ai_controls
```

---

# TABLE 1

# governance.feature_flags

## Purpose

Controls platform features.

---

## Structure

```sql id="k4m8qx"
governance.feature_flags
------------------------

id UUID PRIMARY KEY

flag_name VARCHAR(100) UNIQUE

enabled BOOLEAN DEFAULT false

description TEXT

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Example Flags

```text id="u9r2pv"
MULTI_CONTENT_CAMPAIGN_ENABLED

AI_ROTATION_ENABLED

AI_ANALYTICS_ENABLED

AI_AUDIENCE_MATCHING_ENABLED

AUTO_COOLDOWN_ENABLED

AUTO_BONUS_ENABLED
```

---

## Recommended Indexes

```sql id="j2m7qw"
INDEX feature_flag_name_idx(flag_name)

INDEX feature_flag_enabled_idx(enabled)
```

---

# TABLE 2

# governance.system_settings

## Purpose

Stores global platform settings.

---

## Structure

```sql id="g8r4mx"
governance.system_settings
--------------------------

id UUID PRIMARY KEY

setting_name VARCHAR(100) UNIQUE

setting_value JSONB

description TEXT

updated_by UUID
REFERENCES identity.users(id)

updated_at TIMESTAMP
```

---

## Example Settings

```text id="v5m9qx"
MAX_COMMUNITY_SIZE

MAX_CREATOR_CIRCLE_SIZE

DEFAULT_COOLDOWN_DAYS

DEFAULT_CAMPAIGN_DURATION

DEFAULT_BONUS_AMOUNT
```

---

## Recommended Indexes

```sql id="n3r7pv"
INDEX system_setting_name_idx(setting_name)
```

---

# TABLE 3

# governance.governance_rules

## Purpose

Stores platform governance rules.

---

## Structure

```sql id="a6m8qw"
governance.governance_rules
---------------------------

id UUID PRIMARY KEY

rule_code VARCHAR(50) UNIQUE

rule_name VARCHAR(255)

description TEXT

is_active BOOLEAN DEFAULT true

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Example Rules

```text id="p1r9mx"
NO_SELF_EXPOSURE

MAX_COMMUNITY_SIZE_100

COOLDOWN_REQUIRED

REPUTATION_REQUIRED

ADMIN_APPROVAL_REQUIRED
```

---

## Recommended Indexes

```sql id="w4m2pv"
INDEX governance_rule_code_idx(rule_code)

INDEX governance_rule_active_idx(is_active)
```

---

# TABLE 4

# governance.admin_overrides

## Purpose

Stores administrator overrides.

---

## Structure

```sql id="t7r8qx"
governance.admin_overrides
--------------------------

id UUID PRIMARY KEY

override_type VARCHAR(100)

target_schema VARCHAR(100)

target_table VARCHAR(100)

target_id UUID

reason TEXT

created_by UUID
REFERENCES identity.users(id)

created_at TIMESTAMP

expires_at TIMESTAMP NULL
```

---

## Example Overrides

```text id="q9m4qw"
Ignore Cooldown

Restore Community

Enable Campaign

Grant Bonus

Remove Restriction
```

---

## Recommended Indexes

```sql id="d5r2pv"
INDEX admin_override_type_idx(override_type)

INDEX admin_override_target_idx(target_id)
```

---

# TABLE 5

# governance.platform_experiments

## Purpose

Supports controlled platform experimentation.

---

## Structure

```sql id="h8m7qx"
governance.platform_experiments
-------------------------------

id UUID PRIMARY KEY

experiment_name VARCHAR(255)

description TEXT

status VARCHAR(50)

configuration JSONB

started_at TIMESTAMP

ended_at TIMESTAMP NULL

created_at TIMESTAMP
```

---

## Status

```text id="u2r8mx"
draft

active

paused

completed

archived
```

---

## Example Experiments

```text id="b6m9qw"
AI Audience Matching

Automatic Rotation

Dynamic Cooldowns

Community Scoring
```

---

## Recommended Indexes

```sql id="r4k7pv"
INDEX experiment_name_idx(experiment_name)

INDEX experiment_status_idx(status)
```

---

# TABLE 6

# governance.ai_controls

## Purpose

Controls AI functionality.

All AI systems remain disabled by default.

---

## Structure

```sql id="m1r8qx"
governance.ai_controls
----------------------

id UUID PRIMARY KEY

ai_feature VARCHAR(100)

enabled BOOLEAN DEFAULT false

configuration JSONB

updated_by UUID
REFERENCES identity.users(id)

updated_at TIMESTAMP
```

---

## Example Controls

```text id="y8m3qw"
AI_ROTATION

AI_ANALYTICS

AI_DISCOVERY

AI_RECOMMENDATIONS

AI_MODERATION
```

---

## Recommended Indexes

```sql id="c7r4pv"
INDEX ai_control_feature_idx(ai_feature)

INDEX ai_control_enabled_idx(enabled)
```

---

# Governance Relationships

```text id="p5m8qx"
identity.users
         ↓
system_settings

identity.users
         ↓
admin_overrides

identity.users
         ↓
ai_controls
```

---

# Governance Principles

PCGH governance ensures:

```text id="v3r7mx"
Controlled Growth

Platform Stability

Feature Safety

Auditability

Future Expansion
```

---

# Future Features

Reserved schemas:

```text id="n9m2qw"
audit

notifications

billing

marketplace

events

ai
```

---

# RLS Philosophy

Administrators may:

```text id="g4r8pv"
Manage all governance controls
```

Users may:

```text id="x1m7qw"
Have no direct access
```

Service roles may:

```text id="k6r9mx"
Read configuration
Execute controls
```

---

# Governance Schema Status

```text id="j8m4qw"
governance schema

tables:
6

status:
LOCKED
```

The Governance Schema becomes the constitutional framework of the PCGH operating system.

