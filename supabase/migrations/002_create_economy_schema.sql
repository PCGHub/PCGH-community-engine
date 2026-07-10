-- =============================================================================
-- Migration: 002_create_economy_schema.sql
--
-- Purpose:
--   Creates the economy schema — creator credit wallets, the credit ledger,
--   campaigns, campaign content assets, and campaign distributions.
--
-- Responsibilities:
--   - Create the `economy` schema and its 5 approved tables.
--   - Enforce documented constraints (unique, check, foreign key), plus the
--     ledger-arithmetic and budget invariants implied by the documented
--     columns (balance_after = balance_before + amount; credits_spent <=
--     credits_budget).
--   - Create documented indexes.
--   - Enable Row Level Security and the policies documented in
--     docs/economy-schema.md ("RLS Boundary").
--
-- Relationships:
--   identity.users -> economy.credit_wallets -> economy.credit_transactions
--   identity.users -> economy.campaigns -> economy.campaign_asset
--   economy.campaigns -> economy.campaign_distributions -> identity.member_communities
--
-- Notes:
--   - economy.credit_transactions is an append-only ledger: no UPDATE/DELETE
--     policy exists for any authenticated role, matching "no transaction is
--     ever deleted."
--   - The documented RLS Boundary grants creators only "Create campaigns" and
--     "View own campaigns" (no update/delete), and grants administrators only
--     "View all" for wallets/transactions/campaigns ("Manage" is documented
--     solely for distributions). Mutations to wallets, the ledger, and
--     campaign status/spend are therefore performed by trusted backend
--     services using the service_role key, which bypasses RLS, not by
--     authenticated users through these policies.
--   - economy.campaign_asset and economy.campaign_distributions are not
--     explicitly named in the RLS Boundary. Because "1 campaign = 1 content
--     asset" makes campaign_asset an inseparable part of the documented
--     "Create campaigns" / "View own campaigns" creator capability, its
--     policies mirror the campaigns policies via campaign ownership.
--     campaign_distributions has no creator-facing policy at all, matching
--     the documented boundary where only administrators are given any
--     permission ("Manage all distributions") over that table.
--   - Reuses identity.current_user_id(), identity.is_admin(), and
--     identity.set_updated_at() from 001_create_identity_schema.sql rather
--     than redefining equivalent helpers.
--
-- Future expansion:
--   - protection, intelligence, and analytics schemas will reference
--     economy.campaigns(id) and economy.credit_transactions(id).
--
-- Source of truth: docs/economy-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists economy;

comment on schema economy is
  'Creator credit economy: wallets, the credit ledger, campaigns, campaign content assets, and campaign distributions. Manages visibility, discovery, and amplification -- not payments for engagement.';

-- =============================================================================
-- TABLE 1: economy.credit_wallets
-- =============================================================================

create table if not exists economy.credit_wallets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references identity.users(id),
  balance             integer not null default 0
                        constraint credit_wallets_balance_check
                        check (balance >= 0),
  bonus_balance       integer not null default 0
                        constraint credit_wallets_bonus_balance_check
                        check (bonus_balance >= 0),
  lifetime_purchased  integer not null default 0
                        constraint credit_wallets_lifetime_purchased_check
                        check (lifetime_purchased >= 0),
  lifetime_spent      integer not null default 0
                        constraint credit_wallets_lifetime_spent_check
                        check (lifetime_spent >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint credit_wallets_user_unique unique (user_id)
);

comment on table economy.credit_wallets is
  'Creator credit balances. One wallet per creator.';

create index if not exists wallet_balance_idx on economy.credit_wallets(balance);

drop trigger if exists credit_wallets_set_updated_at on economy.credit_wallets;
create trigger credit_wallets_set_updated_at
  before update on economy.credit_wallets
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 2: economy.credit_transactions
-- =============================================================================

create table if not exists economy.credit_transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references identity.users(id),
  transaction_type  varchar(50) not null
                      constraint credit_transactions_type_check
                      check (transaction_type in ('purchase', 'campaign', 'refund', 'bonus', 'adjustment')),
  amount            integer not null,
  balance_before    integer not null
                      constraint credit_transactions_balance_before_check
                      check (balance_before >= 0),
  balance_after     integer not null
                      constraint credit_transactions_balance_after_check
                      check (balance_after >= 0),
  reference         varchar(100),
  description       text,
  created_at        timestamptz not null default now(),
  constraint credit_transactions_arithmetic_check
    check (balance_after = balance_before + amount)
);

comment on table economy.credit_transactions is
  'Accounting ledger for credit wallets. Append-only: no transaction is ever deleted or updated.';

create index if not exists credit_tx_user_idx on economy.credit_transactions(user_id);
create index if not exists credit_tx_type_idx on economy.credit_transactions(transaction_type);
create index if not exists credit_tx_created_idx on economy.credit_transactions(created_at);

-- =============================================================================
-- TABLE 3: economy.campaigns
-- =============================================================================

create table if not exists economy.campaigns (
  id              uuid primary key default gen_random_uuid(),
  campaign_code   varchar(30) unique not null,
  creator_id      uuid not null references identity.users(id),
  campaign_type   varchar(50) not null
                    constraint campaigns_type_check
                    check (campaign_type in ('creator', 'business', 'ministry', 'organization', 'educational')),
  title           varchar(255) not null,
  description     text,
  content_type    varchar(50),
  status          varchar(50) not null default 'draft'
                    constraint campaigns_status_check
                    check (status in ('draft', 'scheduled', 'active', 'completed', 'archived')),
  credits_budget  integer not null
                    constraint campaigns_credits_budget_check
                    check (credits_budget >= 0),
  credits_spent   integer not null default 0
                    constraint campaigns_credits_spent_check
                    check (credits_spent >= 0),
  duration_hours  integer
                    constraint campaigns_duration_hours_check
                    check (duration_hours is null or duration_hours > 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint campaigns_spent_within_budget_check
    check (credits_spent <= credits_budget)
);

comment on table economy.campaigns is
  'Creator campaigns. One campaign belongs to exactly one campaign type and has exactly one content asset.';

create index if not exists campaigns_creator_idx on economy.campaigns(creator_id);
create index if not exists campaigns_type_idx on economy.campaigns(campaign_type);
create index if not exists campaigns_status_idx on economy.campaigns(status);
create index if not exists campaigns_created_idx on economy.campaigns(created_at);

drop trigger if exists campaigns_set_updated_at on economy.campaigns;
create trigger campaigns_set_updated_at
  before update on economy.campaigns
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 4: economy.campaign_asset
-- =============================================================================

create table if not exists economy.campaign_asset (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references economy.campaigns(id),
  content_url    text not null,
  thumbnail_url  text,
  platform       varchar(50) not null
                   constraint campaign_asset_platform_check
                   check (platform in (
                     'YouTube', 'TikTok', 'Instagram', 'Facebook', 'Websites',
                     'Blogs', 'Music', 'Products', 'Educational Content', 'Ministry Content'
                   )),
  title          varchar(255),
  description    text,
  created_at     timestamptz not null default now(),
  constraint campaign_asset_campaign_unique unique (campaign_id)
);

comment on table economy.campaign_asset is
  'Content asset attached to a campaign. One campaign has exactly one content asset.';

create index if not exists campaign_asset_platform_idx on economy.campaign_asset(platform);

-- =============================================================================
-- TABLE 5: economy.campaign_distributions
-- =============================================================================

create table if not exists economy.campaign_distributions (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references economy.campaigns(id),
  community_id    uuid not null references identity.member_communities(id),
  scheduled_at    timestamptz,
  distributed_at  timestamptz,
  status          varchar(50) not null default 'scheduled'
                    constraint campaign_distributions_status_check
                    check (status in ('scheduled', 'processing', 'distributed', 'completed', 'cancelled')),
  created_at      timestamptz not null default now()
);

comment on table economy.campaign_distributions is
  'Tracks which member communities a campaign was distributed to.';

create index if not exists campaign_distribution_campaign_idx on economy.campaign_distributions(campaign_id);
create index if not exists campaign_distribution_community_idx on economy.campaign_distributions(community_id);
create index if not exists campaign_distribution_status_idx on economy.campaign_distributions(status);

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- Boundary (docs/economy-schema.md "RLS Boundary"):
--   Creators may view their own wallet, view their own transactions, create
--   campaigns, and view their own campaigns.
--   Administrators may view all wallets, view all transactions, view all
--   campaigns, and manage all distributions.
-- =============================================================================

grant usage on schema economy to authenticated, service_role;
grant all on all tables in schema economy to service_role;

-- ---- economy.credit_wallets --------------------------------------------------
-- View-only for creators (own wallet) and administrators (all wallets).
-- Balances are mutated exclusively by trusted backend services via
-- service_role, never directly by authenticated users.

alter table economy.credit_wallets enable row level security;

grant select on economy.credit_wallets to authenticated;

create policy credit_wallets_select_own on economy.credit_wallets
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

-- ---- economy.credit_transactions ---------------------------------------------
-- View-only ledger for creators (own transactions) and administrators (all
-- transactions). No INSERT/UPDATE/DELETE policy exists for any role: entries
-- are written exclusively by trusted backend services via service_role.

alter table economy.credit_transactions enable row level security;

grant select on economy.credit_transactions to authenticated;

create policy credit_transactions_select_own on economy.credit_transactions
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

-- ---- economy.campaigns --------------------------------------------------------
-- Creators may create campaigns and view their own; administrators may view
-- all. No UPDATE/DELETE policy exists: status transitions and spend tracking
-- are driven by trusted backend services via service_role.

alter table economy.campaigns enable row level security;

grant select, insert on economy.campaigns to authenticated;

create policy campaigns_select_own on economy.campaigns
  for select
  to authenticated
  using (creator_id = identity.current_user_id() or identity.is_admin());

create policy campaigns_insert_own on economy.campaigns
  for insert
  to authenticated
  with check (creator_id = identity.current_user_id());

-- ---- economy.campaign_asset ----------------------------------------------------
-- Mirrors the campaigns policies via campaign ownership, since a campaign
-- asset is an inseparable 1:1 part of the campaign it belongs to.

alter table economy.campaign_asset enable row level security;

grant select, insert on economy.campaign_asset to authenticated;

create policy campaign_asset_select_own on economy.campaign_asset
  for select
  to authenticated
  using (
    identity.is_admin()
    or campaign_id in (
      select id from economy.campaigns where creator_id = identity.current_user_id()
    )
  );

create policy campaign_asset_insert_own on economy.campaign_asset
  for insert
  to authenticated
  with check (
    campaign_id in (
      select id from economy.campaigns where creator_id = identity.current_user_id()
    )
  );

-- ---- economy.campaign_distributions ---------------------------------------------
-- No creator-facing policy: the documented boundary gives creators no
-- permission over distributions. Administrators may fully manage this table.

alter table economy.campaign_distributions enable row level security;

grant select, insert, update, delete on economy.campaign_distributions to authenticated;

create policy campaign_distributions_admin_manage on economy.campaign_distributions
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());
