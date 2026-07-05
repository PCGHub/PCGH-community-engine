# PCGH Campaign Engine

## Overview

The Campaign Engine manages creator campaigns and campaign lifecycle management.

In PCGH V1:

```text id="f6m3yw"
1 Campaign
=
1 Content Asset
```

This simplifies:

* Analytics
* Distribution
* Billing
* Creator experience

---

# Campaign Flow

```text id="q9p2jk"
Creator
      ↓
Credit Wallet
      ↓
Campaign
      ↓
Campaign Asset
      ↓
Distribution
```

---

# Campaign Philosophy

Creators pay for:

* Visibility
* Discovery
* Distribution

Creators do not pay for:

* Likes
* Comments
* Shares
* Guaranteed engagement

---

# Campaign Lifecycle

```text id="a2k7vz"
draft

scheduled

active

completed

archived
```

---

# campaigns

```text id="w3m9bt"
id

campaign_code

creator_id

title

description

content_type

status

credits_budget

credits_spent

duration_hours

created_at

updated_at
```

---

# campaign_asset

Each campaign contains one content asset.

## campaign_asset

```text id="y5r1pk"
id

campaign_id

content_url

thumbnail_url

platform

title

description

created_at
```

---

# Supported Content

```text id="g7v8dn"
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

# Campaign Example

```text id="h8j4qw"
Campaign:
CMP0001

Creator:
Victor

Platform:
YouTube

Budget:
500 Credits

Duration:
72 Hours
```

---

# Campaign Philosophy

Campaigns create discovery opportunities.

Campaigns do not create engagement tasks.
