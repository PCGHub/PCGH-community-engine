# PCGH Seed Data

## Status

LOCKED

## Phase

Phase 3 — Database Initialization

---

# Purpose

Seed Data initializes the PCGH platform with the default records required for normal platform operation.

Unlike business data, seed data is installed automatically during deployment.

Seed Data provides:

- Default configuration
- Platform settings
- Governance controls
- Badge definitions
- Feature flags
- AI controls
- System defaults

Seed Data does not contain user-generated content.

---

# Seed Philosophy

Seed Data represents platform defaults.

It should be:

- Safe
- Repeatable
- Deterministic
- Idempotent

Running the Seed Migration multiple times must never create duplicate records.

---

# Identity Seed Data

Identity Schema contains no default seed records.

Roles are assigned during user creation.

Approved platform roles are:

```text
admin

creator

member
```

This section is documentation only and does not imply seeded database rows.

---

# Intelligence Seed Data

The Intelligence Schema initializes the Badge Catalog.

## Default Badges

```text
Platform Pioneer

Verified Creator

Trusted Creator

Community Champion

Top Contributor

Discovery Expert

Campaign Master

Early Supporter
```

Badges are definitions only.

No badges are assigned during seed.

---

# Governance Seed Data

Governance initializes the platform configuration.

---

## Feature Flags

Examples:

```text
MULTI_CONTENT_CAMPAIGN_ENABLED

AI_ROTATION_ENABLED

AI_ANALYTICS_ENABLED

AI_AUDIENCE_MATCHING_ENABLED

AUTO_COOLDOWN_ENABLED

AUTO_BONUS_ENABLED
```

Default values are determined by platform administrators.

---

## System Settings

Examples:

```text
MAX_COMMUNITY_SIZE

MAX_CREATOR_CIRCLE_SIZE

DEFAULT_COOLDOWN_DAYS

DEFAULT_CAMPAIGN_DURATION

DEFAULT_BONUS_AMOUNT
```

---

## Governance Rules

Examples:

```text
NO_SELF_EXPOSURE

MAX_COMMUNITY_SIZE_100

COOLDOWN_REQUIRED

REPUTATION_REQUIRED

ADMIN_APPROVAL_REQUIRED
```

---

## AI Controls

Examples:

```text
AI_ROTATION

AI_ANALYTICS

AI_DISCOVERY

AI_RECOMMENDATIONS

AI_MODERATION
```

All AI features remain disabled by default unless explicitly enabled.

---

# Governance Definitions

Feature Flags, Governance Rules, and AI Controls serve distinct purposes and should not be treated interchangeably.

## Feature Flags

System-level feature switches.

Examples:

```text
AI_ROTATION_ENABLED

AUTO_COOLDOWN_ENABLED
```

## Governance Rules

Business policies enforced by the platform.

Examples:

```text
NO_SELF_EXPOSURE

MAX_COMMUNITY_SIZE_100
```

## AI Controls

Individual AI modules that may be enabled or disabled independently.

Examples:

```text
AI_DISCOVERY

AI_ANALYTICS

AI_MODERATION
```

---

# API Seed Data

The API Schema contains:

- Views
- SQL Functions
- Stored Procedures

No seed data exists for the API Schema.

---

# Future Seed Data

Future platform versions may include:

```text
Countries

Languages

Currencies

Marketplace Categories

Notification Templates

Email Templates

Platform Themes

Subscription Plans
```

---

# Seed Rules

All seed data must follow the rules below.

```text
Seed data must be idempotent.

Seed data must never duplicate.

Critical system records must have stable identifiers.

Seed data may be updated through administrative interfaces.

Seed data should remain independent of user-generated content.

Seed data must support repeatable deployments.

Every seeded record should be documented.
```

---

# Implementation Notes

Seed strategy depends on the uniqueness constraints defined by each schema.

Where UNIQUE constraints exist, idempotent insertion strategies such as:

```text
INSERT ...

ON CONFLICT DO NOTHING
```

may be used.

Where UNIQUE constraints do not exist, seed scripts should use existence checks before inserting records.

Seed scripts must be safe to execute multiple times.

---

# Relationships

```text
Identity
    │
Intelligence
    │
Governance
    │
──────────────
    │
Seed Data
```

- Identity contributes documented default platform roles (not seeded records).
- Intelligence provides the default Badge Catalog.
- Governance provides Feature Flags, System Settings, Governance Rules, and AI Controls.
- Discovery, Protection, Economy, and API contain no default seed records in the current platform architecture.

---

# Future AI Usage

AI may eventually generate default platform configurations for new deployments.

Examples include:

```text
AI Configuration Templates

AI Default Governance Profiles

AI Badge Recommendations

AI Feature Presets
```

All remain disabled unless approved by administrators.

---

# Seed Data Status

```text
Document:
docs/seed-data.md

Status:
FINAL

Ready for Claude Review

Migration:
008_seed_data.sql
```