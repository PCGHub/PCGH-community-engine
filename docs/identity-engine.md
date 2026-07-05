# PCGH Identity Engine

## Overview

The PCGH Identity Engine provides the foundational identity and relationship architecture of the platform.

It defines:

* User identity
* User roles
* Creator circles
* Member communities
* Visibility rules
* Community assignment foundations

The Identity Engine is the root dependency for all other PCGH engines.

---

# Identity Philosophy

PCGH users may participate in multiple capacities.

A user may be:

* A community member
* A creator
* An administrator

A creator may also be a community member.

Example:

```text
Victor

Creator Circle:
C007

Member Community:
M014
```

---

# User Identity

Every user has a unique identity.

## users

```text
id

user_code

email

full_name

username

avatar_url

status

created_at

updated_at
```

---

# User Roles

Users may have one or more roles.

## user_roles

```text
id

user_id

role_name

created_at
```

---

## Available Roles

```text
member

creator

admin
```

---

# Creator Circles

Creator circles group creators into manageable communities.

## Creator Circle Rules

* Maximum 100 creators per circle
* Unlimited creator circles
* Automatic creator assignment
* Automatic creator circle creation
* Creator circles are visible to administrators
* Creators may view their own creator circle

---

## creator_circles

```text
id

circle_code

name

status

created_at
```

---

## creator_circle_members

```text
id

circle_id

user_id

joined_at
```

---

# Member Communities

Member communities group members into amplification communities.

## Member Community Rules

* Maximum 100 members per community
* Unlimited communities
* Automatic assignment
* Automatic community creation
* Members only see their own community
* Administrators see all communities

---

## member_communities

```text
id

community_code

name

status

created_at
```

---

## member_community_members

```text
id

community_id

user_id

joined_at
```

---

# Identity Relationships

Example:

```text
Victor

Roles:

✓ Creator
✓ Member

Creator Circle:
C007

Member Community:
M014
```

---

# Visibility Rules

## Members

Can view:

* Their own profile
* Their own community
* Their own standing
* Their own badges

Cannot view:

* Other communities
* Reputation algorithms
* Platform analytics

---

## Creators

Can view:

* Their own creator profile
* Their own creator circle
* Their campaigns
* Their analytics
* Their badges

Cannot view:

* Other creator circles
* Community internals
* Platform analytics

---

## Administrators

Can view:

* All users
* All creators
* All communities
* All creator circles
* All analytics
* All reputation scores
* All recognition systems

---

# Administrative Identity View

Example:

```text
Victor

User ID:
U000024

Roles:
Creator
Member

Creator Circle:
C007

Member Community:
M014

Status:
Active
```

---

# Identity Architecture

```text
users
     |
     |
user_roles
     |
     +------------------+
     |                  |
creator_circle_members
member_community_members
     |                  |
creator_circles
member_communities
```

---

# Core Philosophy

The Identity Engine ensures that PCGH remains:

* Community powered
* Creator focused
* Role flexible
* Scalable
* Governable

The Identity Engine is the foundation of the entire PCGH operating system.

