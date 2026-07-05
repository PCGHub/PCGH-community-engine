# PCGH Credit Engine

## Overview

The PCGH Credit Engine manages creator spending and campaign budgeting.

Credits are not rewards.

Credits represent a creator's audience amplification budget.

The Credit Engine is responsible for:

* Credit purchases
* Credit spending
* Credit tracking
* Credit accounting
* Bonus credit management

---

# Credit Philosophy

PCGH does not pay users for engagement.

Creators purchase credits to distribute content through community-powered audience amplification.

Example:

```text id="j4vqpn"
Creator:
Victor

Purchases:
1000 Credits

Creates:
Campaign

Budget:
500 Credits
```

---

# Credit Types

PCGH supports two types of credits.

## Creator Credits

Used for:

* Campaign creation
* Audience amplification
* Content distribution

---

## Performance Bonus Credits

Used for:

* Recognition
* Campaign discounts
* Premium features
* Creator upgrades
* Platform benefits

---

# Credit Wallet

Every creator has a credit wallet.

## credit_wallets

```text id="c9h2vx"
id

user_id

balance

bonus_balance

lifetime_purchased

lifetime_spent

created_at

updated_at
```

---

# Credit Transactions

Every credit movement is recorded.

## credit_transactions

```text id="u4j6nb"
id

user_id

transaction_type

amount

balance_before

balance_after

reference

description

created_at
```

---

# Transaction Types

```text id="v7t3rk"
purchase

campaign

refund

bonus

adjustment
```

---

# Example

```text id="x5k9fp"
Victor

Balance:
5000

Bonus:
1000

Lifetime Purchased:
10000

Lifetime Spent:
5000
```

---

# Credit Philosophy

Credits represent visibility budgets and platform recognition.

Credits do not represent compensation for engagement.

