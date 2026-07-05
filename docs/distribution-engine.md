# PCGH Distribution Engine

## Overview

The Distribution Engine transforms campaigns into community-powered audience amplification.

The Distribution Engine is the bridge between:

* Campaigns
* Discovery opportunities
* Communities
* Members

---

# Distribution Philosophy

PCGH distributes:

* Discovery
* Visibility
* Audience exposure

PCGH does not distribute:

* Engagement tasks
* Paid actions
* Artificial interactions

---

# Distribution Flow

```text id="r3m7vx"
Creator
      ↓
Campaign
      ↓
Distribution Engine
      ↓
Discovery Opportunity
      ↓
Communities
      ↓
Members
      ↓
Amplification
```

---

# Distribution Rules

* Communities are diversified.
* Distribution is time-based.
* Communities rotate.
* Creators never receive their own campaigns.
* Community history is preserved.
* Distribution remains natural.

---

# campaign_distributions

```text id="u8k2mp"
id

campaign_id

community_id

scheduled_at

distributed_at

status

created_at
```

---

# Distribution Status

```text id="t5n9rb"
scheduled

processing

distributed

completed

cancelled
```

---

# Community Distribution

Example:

```text id="v1j4qt"
Campaign:
CMP0001

Communities:

M014
M028
M072
```

---

# Distribution History

Distribution history never disappears.

Example:

```text id="n6q3yk"
Campaign:
CMP0001

Communities:
3

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

# Distribution Controls

The Distribution Engine respects:

* Rotation Engine
* Governance Engine
* Community cooldowns
* Community exclusions
* Administrative overrides

---

# Distribution Philosophy

The purpose of distribution is:

```text id="z4h7wp"
Discovery
       ↓
Visibility
       ↓
Amplification
```

and never:

```text id="b9k2xc"
Task
     ↓
Payment
     ↓
Engagement
```

