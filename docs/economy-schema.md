# PCGH Economy Schema

## Schema

```text id="r9m4vx"
economy
```

## Status

DESIGNED

## Phase

Phase 2 — Implementation

---

# Purpose

The Economy Schema manages:

* Creator credits
* Credit transactions
* Campaign budgets
* Campaign spending
* Campaign content
* Campaign distribution

The economy system controls how creators convert purchased credits into audience amplification.

---

# Tables

```text id="m6q2pk"
economy.credit_wallets

economy.credit_transactions

economy.campaigns

economy.campaign_asset

economy.campaign_distributions
```

---

# TABLE 1

# economy.credit_wallets

## Purpose

Stores creator credit balances.

---

## Structure

```sql id="g5r8mx"
economy.credit_wallets
----------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

balance INTEGER DEFAULT 0

bonus_balance INTEGER DEFAULT 0

lifetime_purchased INTEGER DEFAULT 0

lifetime_spent INTEGER DEFAULT 0

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Rules

```text id="u8k5pv"
One wallet per creator

One creator can only own one wallet
```

---

## Constraint

```sql id="d3m9qw"
UNIQUE(user_id)
```

---

## Example

```text id="x2r7pn"
Victor

Balance:
5000

Bonus:
1000

Lifetime Purchased:
15000

Lifetime Spent:
10000
```

---

## Recommended Indexes

```sql id="q7v2mk"
INDEX wallet_user_idx(user_id)

INDEX wallet_balance_idx(balance)
```

---

# TABLE 2

# economy.credit_transactions

## Purpose

Acts as the accounting ledger.

No transaction is ever deleted.

---

## Structure

```sql id="a4k8pv"
economy.credit_transactions
---------------------------

id UUID PRIMARY KEY

user_id UUID
REFERENCES identity.users(id)

transaction_type VARCHAR(50)

amount INTEGER

balance_before INTEGER

balance_after INTEGER

reference VARCHAR(100)

description TEXT

created_at TIMESTAMP
```

---

## Transaction Types

```text id="m5q7wr"
purchase

campaign

refund

bonus

adjustment
```

---

## Example

```text id="v3m8qx"
purchase
+1000

campaign
-500

bonus
+100
```

---

## Recommended Indexes

```sql id="b8r4pt"
INDEX credit_tx_user_idx(user_id)

INDEX credit_tx_type_idx(transaction_type)

INDEX credit_tx_created_idx(created_at)
```

---

# TABLE 3

# economy.campaigns

## Purpose

Stores creator campaigns.

---

## Rule

```text id="p1k9mv"
1 Campaign
=
1 Content Asset
```

---

## Structure

```sql id="n7q3px"
economy.campaigns
-----------------

id UUID PRIMARY KEY

campaign_code VARCHAR(30) UNIQUE

creator_id UUID
REFERENCES identity.users(id)

title VARCHAR(255)

description TEXT

content_type VARCHAR(50)

status VARCHAR(50)

credits_budget INTEGER

credits_spent INTEGER DEFAULT 0

duration_hours INTEGER

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Status

```text id="s6m2qw"
draft

scheduled

active

completed

archived
```

---

## Example

```text id="f4r8pn"
CMP0001

Creator:
Victor

Budget:
500

Duration:
72 hours
```

---

## Recommended Indexes

```sql id="z9k5mx"
INDEX campaigns_creator_idx(creator_id)

INDEX campaigns_status_idx(status)

INDEX campaigns_created_idx(created_at)
```

---

# TABLE 4

# economy.campaign_asset

## Purpose

Stores the content attached to a campaign.

---

## Rule

```text id="r7p4vq"
One campaign
has
one content asset
```

---

## Structure

```sql id="t2m8wx"
economy.campaign_asset
----------------------

id UUID PRIMARY KEY

campaign_id UUID
REFERENCES economy.campaigns(id)

content_url TEXT

thumbnail_url TEXT

platform VARCHAR(50)

title VARCHAR(255)

description TEXT

created_at TIMESTAMP
```

---

## Supported Platforms

```text id="w5q1pk"
YouTube

TikTok

Instagram

Facebook

Websites

Blogs

Music

Products

Educational Content

Ministry Content
```

---

## Constraint

```sql id="v8m3rx"
UNIQUE(campaign_id)
```

---

## Recommended Indexes

```sql id="u1k7pt"
INDEX campaign_asset_campaign_idx(campaign_id)

INDEX campaign_asset_platform_idx(platform)
```

---

# TABLE 5

# economy.campaign_distributions

## Purpose

Tracks where campaigns were distributed.

---

## Structure

```sql id="e4r9mv"
economy.campaign_distributions
------------------------------

id UUID PRIMARY KEY

campaign_id UUID
REFERENCES economy.campaigns(id)

community_id UUID
REFERENCES identity.member_communities(id)

scheduled_at TIMESTAMP

distributed_at TIMESTAMP

status VARCHAR(50)

created_at TIMESTAMP
```

---

## Status

```text id="g2m7qw"
scheduled

processing

distributed

completed

cancelled
```

---

## Example

```text id="h9r4px"
Campaign:
CMP0001

Communities:

M014
M028
M072
```

---

## Recommended Indexes

```sql id="j5k8pn"
INDEX campaign_distribution_campaign_idx(campaign_id)

INDEX campaign_distribution_community_idx(community_id)

INDEX campaign_distribution_status_idx(status)
```

---

# Economy Relationships

```text id="n8q3mv"
identity.users
          ↓
credit_wallets
          ↓
credit_transactions

identity.users
          ↓
campaigns
          ↓
campaign_asset
          ↓
campaign_distributions
```

---

# RLS Boundary

Creators may:

```text id="q4m7pw"
View own wallet

View own transactions

Create campaigns

View own campaigns
```

Administrators may:

```text id="u7r2qx"
View all wallets

View all transactions

View all campaigns

Manage all distributions
```

---

# Economy Philosophy

The Economy Engine manages:

```text id="z1m5rv"
Visibility

Discovery

Amplification
```

It does not manage:

```text id="y6k8pq"
Payments for engagement

Task rewards

Engagement farming
```

---

# Economy Schema Status

```text id="c3r9mw"
economy schema

tables:
5

status:
LOCKED
```
