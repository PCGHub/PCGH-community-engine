# PCGH Identity Schema

## Schema

```text id="m7r2pv"
identity
```

## Status

LOCKED

## Phase

Phase 2 — Implementation

---

# Purpose

The Identity Schema provides the foundational identity architecture for the entire PCGH platform.

All other schemas ultimately depend on:

```text id="x3k8qw"
identity.users.id
```

The Identity Schema manages:

* User identities
* User roles
* Creator circles
* Community membership
* Creator membership
* Community assignment

---

# Tables

```text id="v8p4mx"
identity.users

identity.user_roles

identity.creator_circles

identity.creator_circle_members

identity.member_communities

identity.community_member_history

identity.member_community_members

```

---

# TABLE 1

# identity.users

## Purpose

Stores the master user record.

---

## Structure

```sql id="w5m7pn"
identity.users
--------------

id UUID PRIMARY KEY

auth_user_id UUID UNIQUE

user_code VARCHAR(20) UNIQUE

email VARCHAR(255) UNIQUE

username VARCHAR(50) UNIQUE

full_name VARCHAR(255)

avatar_url TEXT

phone VARCHAR(30)

country VARCHAR(100)

timezone VARCHAR(100)

status VARCHAR(30)

email_verified BOOLEAN DEFAULT false

last_login_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Status Values

```text id="n4r9qw"
active

pending

suspended

deleted
```

---

## Example

```text id="k2m7pv"
U000024

Victor

victor@example.com

active
```

---

## Relationships

```text id="z6q8mx"
identity.users.auth_user_id
        ↓
auth.users.id
```

---

## Recommended Indexes

```sql id="c8m3pt"
INDEX users_email_idx(email)

INDEX users_username_idx(username)

INDEX users_status_idx(status)

INDEX users_created_at_idx(created_at)
```

---

# TABLE 2

# identity.user_roles

## Purpose

Supports multiple roles per user.

---

## Structure

```sql id="b5r7qn"
identity.user_roles
-------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

role_name VARCHAR(50)

created_at TIMESTAMP
```

---

## Allowed Roles

```text id="u4m9pv"
member

creator

admin
```

---

## Example

```text id="q8r2mx"
Victor

creator
member
```

---

## Recommended Indexes

```sql id="j6k5qw"
INDEX user_roles_user_idx(user_id)

INDEX user_roles_role_idx(role_name)
```

---

# TABLE 3

# identity.creator_circles

## Purpose

Stores creator communities.

---

## Rules

```text id="g3m7pv"
Maximum creators:
100

Unlimited circles:
YES

Auto creation:
YES
```

---

## Structure

```sql id="h9r2qw"
identity.creator_circles
------------------------

id UUID PRIMARY KEY

circle_code VARCHAR(20) UNIQUE

name VARCHAR(255)

member_count INTEGER DEFAULT 0

status VARCHAR(30)

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Status

```text id="r1m8qx"
active

archived

locked
```

---

## Example

```text id="t4k7pv"
C007

Creator Circle 7
```

---

## Recommended Indexes

```sql id="x2m9qw"
INDEX creator_circles_status_idx(status)

INDEX creator_circles_member_count_idx(member_count)
```

---

# TABLE 4

# identity.creator_circle_members

## Purpose

Links creators to creator circles.

---

## Structure

```sql id="v7r3mx"
identity.creator_circle_members
-------------------------------

id UUID PRIMARY KEY

circle_id UUID
REFERENCES identity.creator_circles(id)

user_id UUID
REFERENCES identity.users(id)

joined_at TIMESTAMP
```

---

## Constraint

```sql id="w8k2pv"
UNIQUE(user_id)
```

---

## Recommended Indexes

```sql id="p5m7qw"
INDEX creator_circle_members_circle_idx(circle_id)

INDEX creator_circle_members_user_idx(user_id)
```

---

# TABLE 5

# identity.member_communities

## Purpose

Stores community groups.

---

## Rules

```text id="d9r4mx"
Maximum members:
100

Unlimited communities:
YES

Auto creation:
YES
```

---

## Structure

```sql id="u3k8pv"
identity.member_communities
---------------------------

id UUID PRIMARY KEY

community_code VARCHAR(20) UNIQUE

name VARCHAR(255)

member_count INTEGER DEFAULT 0

status VARCHAR(30)

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Status

```text id="n7m5qw"
active

archived

locked
```

---

## Example

```text id="q1r8mx"
M014

Community 14
```

---

## Recommended Indexes

```sql id="f4k2pv"
INDEX member_communities_status_idx(status)

INDEX member_communities_member_count_idx(member_count)
```

---

# TABLE 6

# identity.community_member_history

## Purpose

Stores the complete historical record of member community assignments.

No records are ever deleted.

This table enables:

* community reassignment history
* performance tracking
* fraud detection
* community optimization
* rotation analysis
* historical analytics

---

## Structure

```sql
identity.community_member_history
---------------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

community_id UUID
REFERENCES identity.member_communities(id)

assignment_type VARCHAR(50)

assigned_by UUID
REFERENCES identity.users(id)

joined_at TIMESTAMP

left_at TIMESTAMP NULL

reason TEXT

created_at TIMESTAMP
```

---

## Assignment Types

```text
automatic

manual

migration

administrative
```

---

## Example

```text
Victor

Community:
M014

Joined:
2026-07-01

Left:
2026-07-31

Reason:
Community rotation
```

---

## Example History

```text
Victor

M014
     ↓
M021
     ↓
M076
     ↓
M101
```

---

## Recommended Indexes

```sql
INDEX community_history_user_idx(user_id)

INDEX community_history_community_idx(community_id)

INDEX community_history_joined_idx(joined_at)

INDEX community_history_left_idx(left_at)
```

---

## Business Rules

```text
Community history
is immutable.

Records are never updated.

Records are never deleted.

Community movement
creates a new history record.
```

---

## Analytics Usage

This table supports:

```text
Community effectiveness

Member participation history

Rotation optimization

Fraud detection

Community reassignment analysis

Future AI optimization
```


# TABLE 7

# identity.member_community_members

## Purpose

Links members to communities.

---

## Structure

```sql id="m6r7qw"
identity.member_community_members
---------------------------------

id UUID PRIMARY KEY

community_id UUID
REFERENCES identity.member_communities(id)

user_id UUID
REFERENCES identity.users(id)

joined_at TIMESTAMP
```

---

## Constraint

```sql id="g9m2pv"
UNIQUE(user_id)
```

---

## Recommended Indexes

```sql id="a3r8mx"
INDEX member_community_members_community_idx(community_id)

INDEX member_community_members_user_idx(user_id)
```

---

# Identity Relationships

```text id="b7k4qw"
auth.users
      ↓
identity.users
      ↓
identity.user_roles

identity.users
      ↓
identity.creator_circle_members
      ↓
identity.creator_circles

identity.users
      ↓
identity.member_community_members
      ↓
identity.member_communities
      ↓
identity.community_member_history
```

---

# RLS Philosophy

Users may:

```text id="z5m8pv"
View own profile

Update own profile
```

Creators may:

```text id="t2r7mx"
View own creator circle
```

Members may:

```text id="y4k9qw"
View own community
```

Administrators may:

```text id="c6m3pv"
View and manage everything
```

---

# Identity Schema Status

```text id="w1r8mx"
identity schema

tables:
7

status:
LOCKED
```

This schema becomes the foundational dependency for all PCGH schemas.

---
