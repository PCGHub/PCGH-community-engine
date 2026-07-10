-- =============================================================================
-- Migration: 005_create_intelligence_schema.sql
--
-- Purpose:
--   Creates the intelligence schema — member/creator/community reputation,
--   a universal badge catalog and award record, administrator-approved
--   performance bonuses, and a permanent achievement history. Transforms
--   participation into trust, reputation, and recognition (never engagement
--   payments).
--
-- Responsibilities:
--   - Create the `intelligence` schema and its 8 approved tables.
--   - Enforce documented constraints (unique, foreign key, check).
--   - Create documented indexes.
--   - Enable Row Level Security and the policies documented in
--     docs/intelligence-schema.md ("RLS Philosophy").
--
-- Relationships:
--   identity.users -> intelligence.member_reputation
--   identity.users -> intelligence.creator_reputation
--   identity.member_communities -> intelligence.community_reputation
--   intelligence.badges -> intelligence.user_badges -> identity.users
--   identity.member_communities, economy.campaigns -> intelligence.performance_bonus
--   intelligence.performance_bonus -> intelligence.performance_bonus_members
--   intelligence.member_reputation, creator_reputation, community_reputation,
--     user_badges, performance_bonus, performance_bonus_members
--       -> intelligence.achievement_history
--
-- Notes:
--   - Supersedes the prior revision of this migration, which implemented
--     creator_badges and community_badges. Per the approved Recognition
--     Engine architecture (docs/intelligence-schema.md), badges belong to
--     users, not roles: those two tables are replaced by a single `badges`
--     catalog (definitions) and a single `user_badges` award table
--     (references `badges` rather than duplicating badge information).
--   - `intelligence.achievement_history` is restored: a permanent,
--     append-only log of every reputation milestone, badge award,
--     achievement, and recognition event ("no history is ever deleted").
--     Its `user_id` and `community_id` are both individually nullable
--     because an event may be user-scoped (e.g. a badge award) or
--     community-scoped (e.g. a community reputation milestone); the
--     achievement_target_check constraint requires at least one of the two
--     to be set, so a row can never be targetless. `reference_id` is an
--     unconstrained UUID (no FK) because it points at whichever source
--     table the `event_type` names, which cannot be expressed as a single
--     foreign key.
--   - `intelligence.badges` is the only table in this schema with a
--     documented `updated_at` column, so it is the only table that gets the
--     identity.set_updated_at() trigger, per the requirement to add
--     updated_at triggers only where that column exists.
--   - badges_name_idx and (from the prior revision) member_rep_user_idx /
--     creator_rep_user_idx / community_rep_idx are covered by the implicit
--     unique index their respective UNIQUE constraints already create, so no
--     separate duplicate index is added for those -- same reasoning as
--     wallet_user_idx / campaign_asset_campaign_idx in 002.
--   - RLS for `intelligence.badges` departs from the rest of this schema:
--     the documentation explicitly calls the catalog "definitional, not
--     personal data, and not covered by 'own' access," so it is openly
--     readable to every authenticated user (not scoped to self, not
--     admin-only) while remaining administrator-managed for writes.
--   - `intelligence.user_badges` is NOT append-only in this revision:
--     because `achievement_history` now independently preserves the
--     permanent, immutable record of every badge award, `user_badges` is
--     free to represent current state and administrators may update or
--     revoke an award (e.g. set/adjust expires_at, correct a mistaken
--     award) without compromising the audit trail. This differs from the
--     prior revision, where creator_badges/community_badges were append-only
--     because they were the only historical record available.
--   - `intelligence.performance_bonus` and `performance_bonus_members`
--     remain append-only (SELECT + INSERT only, no UPDATE/DELETE even for
--     administrators): that reasoning is independent of the badge
--     architecture change -- once a recognition bonus is approved and
--     credited it is a financial-ledger-style record, the same category as
--     economy.credit_transactions, and achievement_history is a
--     complementary log, not a replacement for immutability at the source.
--   - `intelligence.achievement_history` itself gets administrator
--     SELECT + INSERT only, matching the append-only pattern already used
--     for protection.rotation_history and discovery.assignment_history.
--     Member/creator self-access is scoped to their own user_id; no
--     community-level self-access is granted, since the RLS Philosophy
--     documents "view own achievement history" for individuals only.
--   - Reuses identity.current_user_id(), identity.is_admin(), and
--     identity.set_updated_at() from 001_create_identity_schema.sql rather
--     than redefining equivalent helpers.
--
-- Future expansion:
--   - analytics schema will reference intelligence.member_reputation(id),
--     intelligence.creator_reputation(id), intelligence.community_reputation(id),
--     and intelligence.achievement_history(id).
--   - AUTO_BONUS_ENABLED, AI_REPUTATION_ENABLED, and AI_RECOGNITION_ENABLED
--     remain disabled platform features and introduce no schema changes
--     here. When enabled, AI_RECOGNITION_ENABLED is documented to govern
--     AI-assisted badge recommendation from the `badges` catalog and
--     AI-assisted analysis of `achievement_history`.
--
-- Source of truth: docs/intelligence-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists intelligence;

comment on schema intelligence is
  'Reputation, the badge catalog and award record, administrator-approved performance bonuses, and permanent achievement history. Transforms participation into trust and recognition -- never engagement payments.';

-- =============================================================================
-- TABLE 1: intelligence.member_reputation
-- =============================================================================

create table if not exists intelligence.member_reputation (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references identity.users(id),
  reputation_score      decimal(10,2) not null,
  participation_score   decimal(10,2) not null,
  consistency_score     decimal(10,2) not null,
  trust_score           decimal(10,2) not null,
  last_updated          timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  constraint member_reputation_user_unique unique (user_id)
);

comment on table intelligence.member_reputation is
  'Member reputation scores. One reputation record per member.';

create index if not exists member_rep_score_idx on intelligence.member_reputation(reputation_score);

-- =============================================================================
-- TABLE 2: intelligence.creator_reputation
-- =============================================================================

create table if not exists intelligence.creator_reputation (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references identity.users(id),
  campaign_score      decimal(10,2) not null,
  quality_score       decimal(10,2) not null,
  consistency_score   decimal(10,2) not null,
  trust_score         decimal(10,2) not null,
  last_updated        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  constraint creator_reputation_user_unique unique (user_id)
);

comment on table intelligence.creator_reputation is
  'Creator reputation scores. One reputation record per creator.';

create index if not exists creator_rep_score_idx on intelligence.creator_reputation(trust_score);

-- =============================================================================
-- TABLE 3: intelligence.community_reputation
-- =============================================================================

create table if not exists intelligence.community_reputation (
  id                  uuid primary key default gen_random_uuid(),
  community_id        uuid not null references identity.member_communities(id),
  reputation_score    decimal(10,2) not null,
  activity_score      decimal(10,2) not null,
  consistency_score   decimal(10,2) not null,
  trust_score         decimal(10,2) not null,
  last_updated        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  constraint community_reputation_community_unique unique (community_id)
);

comment on table intelligence.community_reputation is
  'Community reputation scores. One reputation record per community.';

create index if not exists community_rep_score_idx on intelligence.community_reputation(reputation_score);

-- =============================================================================
-- TABLE 4: intelligence.badges
-- =============================================================================

create table if not exists intelligence.badges (
  id           uuid primary key default gen_random_uuid(),
  badge_name   varchar(100) unique not null,
  description  text,
  icon_url     text,
  category     varchar(100),
  criteria     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table intelligence.badges is
  'Badge catalog: reusable badge definitions, decoupled from who holds them.';

create index if not exists badges_category_idx on intelligence.badges(category);

drop trigger if exists badges_set_updated_at on intelligence.badges;
create trigger badges_set_updated_at
  before update on intelligence.badges
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 5: intelligence.user_badges
-- =============================================================================

create table if not exists intelligence.user_badges (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references identity.users(id),
  badge_id     uuid not null references intelligence.badges(id),
  awarded_at   timestamptz not null default now(),
  expires_at   timestamptz
);

comment on table intelligence.user_badges is
  'Badges awarded to users. Badges belong to users, not roles: one table covers every badge holder.';

create index if not exists user_badges_user_idx on intelligence.user_badges(user_id);
create index if not exists user_badges_badge_idx on intelligence.user_badges(badge_id);

-- =============================================================================
-- TABLE 6: intelligence.performance_bonus
-- =============================================================================

create table if not exists intelligence.performance_bonus (
  id             uuid primary key default gen_random_uuid(),
  bonus_code     varchar(30) not null,
  community_id   uuid not null references identity.member_communities(id),
  campaign_id    uuid not null references economy.campaigns(id),
  bonus_amount   integer not null
                   constraint performance_bonus_amount_check
                   check (bonus_amount >= 0),
  reason         text,
  approved_by    uuid not null references identity.users(id),
  approved_at    timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

comment on table intelligence.performance_bonus is
  'Administrator-approved recognition bonuses -- recognition credits, not engagement payments. Append-only once approved.';

create index if not exists performance_bonus_community_idx on intelligence.performance_bonus(community_id);
create index if not exists performance_bonus_campaign_idx on intelligence.performance_bonus(campaign_id);

-- =============================================================================
-- TABLE 7: intelligence.performance_bonus_members
-- =============================================================================

create table if not exists intelligence.performance_bonus_members (
  id              uuid primary key default gen_random_uuid(),
  bonus_id        uuid not null references intelligence.performance_bonus(id),
  user_id         uuid not null references identity.users(id),
  credit_amount   integer not null
                    constraint performance_bonus_members_credit_amount_check
                    check (credit_amount >= 0),
  credited_at     timestamptz not null default now()
);

comment on table intelligence.performance_bonus_members is
  'Bonus allocations credited to individual community members. Append-only ledger of credited amounts.';

create index if not exists performance_bonus_member_idx on intelligence.performance_bonus_members(user_id);
create index if not exists performance_bonus_bonus_idx on intelligence.performance_bonus_members(bonus_id);

-- =============================================================================
-- TABLE 8: intelligence.achievement_history
-- =============================================================================

create table if not exists intelligence.achievement_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references identity.users(id),
  community_id    uuid references identity.member_communities(id),
  event_type      varchar(50) not null
                    constraint achievement_history_event_type_check
                    check (event_type in ('reputation_milestone', 'badge_award', 'achievement', 'recognition_event')),
  reference_id    uuid,
  description     text,
  metadata        jsonb,
  created_at      timestamptz not null default now(),
  constraint achievement_target_check
    check (user_id is not null or community_id is not null)
);

comment on table intelligence.achievement_history is
  'Permanent history of every reputation milestone, badge award, achievement, and recognition event. Append-only: no history is ever deleted.';

create index if not exists achievement_history_user_idx on intelligence.achievement_history(user_id);
create index if not exists achievement_history_community_idx on intelligence.achievement_history(community_id);
create index if not exists achievement_history_event_type_idx on intelligence.achievement_history(event_type);
create index if not exists achievement_history_created_idx on intelligence.achievement_history(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- Philosophy (docs/intelligence-schema.md "RLS Philosophy"):
--   Members may view their own reputation, badges, bonuses, and achievement
--   history. Creators may view their own reputation, badges, and
--   achievement history. Administrators may view and manage everything --
--   qualified, for the badge catalog and the append-only tables, by the
--   documented notes above.
-- =============================================================================

grant usage on schema intelligence to authenticated, service_role;
grant all on all tables in schema intelligence to service_role;

-- ---- intelligence.member_reputation --------------------------------------------
-- Members view their own reputation; administrators view and manage all.

alter table intelligence.member_reputation enable row level security;

grant select, insert, update, delete on intelligence.member_reputation to authenticated;

create policy member_reputation_select_own on intelligence.member_reputation
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy member_reputation_admin_insert on intelligence.member_reputation
  for insert
  to authenticated
  with check (identity.is_admin());

create policy member_reputation_admin_update on intelligence.member_reputation
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy member_reputation_admin_delete on intelligence.member_reputation
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- intelligence.creator_reputation --------------------------------------------
-- Creators view their own reputation; administrators view and manage all.

alter table intelligence.creator_reputation enable row level security;

grant select, insert, update, delete on intelligence.creator_reputation to authenticated;

create policy creator_reputation_select_own on intelligence.creator_reputation
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy creator_reputation_admin_insert on intelligence.creator_reputation
  for insert
  to authenticated
  with check (identity.is_admin());

create policy creator_reputation_admin_update on intelligence.creator_reputation
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy creator_reputation_admin_delete on intelligence.creator_reputation
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- intelligence.community_reputation --------------------------------------------
-- Not named for members or creators in the RLS Philosophy: administrator-only.

alter table intelligence.community_reputation enable row level security;

grant select, insert, update, delete on intelligence.community_reputation to authenticated;

create policy community_reputation_admin_manage on intelligence.community_reputation
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- intelligence.badges --------------------------------------------------------
-- Definitional catalog, not personal data: openly readable to every
-- authenticated user, not scoped to "own" and not admin-only for reads.
-- Writes (defining/editing/removing badge types) remain administrator-only.

alter table intelligence.badges enable row level security;

grant select, insert, update, delete on intelligence.badges to authenticated;

create policy badges_select_all on intelligence.badges
  for select
  to authenticated
  using (true);

create policy badges_admin_insert on intelligence.badges
  for insert
  to authenticated
  with check (identity.is_admin());

create policy badges_admin_update on intelligence.badges
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy badges_admin_delete on intelligence.badges
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- intelligence.user_badges --------------------------------------------------
-- Members and creators view their own badge awards; administrators view and
-- manage all (not append-only -- see Notes above on why achievement_history
-- now carries the immutable audit trail for badge awards).

alter table intelligence.user_badges enable row level security;

grant select, insert, update, delete on intelligence.user_badges to authenticated;

create policy user_badges_select_own on intelligence.user_badges
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy user_badges_admin_insert on intelligence.user_badges
  for insert
  to authenticated
  with check (identity.is_admin());

create policy user_badges_admin_update on intelligence.user_badges
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy user_badges_admin_delete on intelligence.user_badges
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- intelligence.performance_bonus --------------------------------------------------
-- Not named for members or creators in the RLS Philosophy: administrator-only,
-- and append-only once approved (no UPDATE/DELETE policy for any role).

alter table intelligence.performance_bonus enable row level security;

grant select, insert on intelligence.performance_bonus to authenticated;

create policy performance_bonus_admin_select on intelligence.performance_bonus
  for select
  to authenticated
  using (identity.is_admin());

create policy performance_bonus_admin_insert on intelligence.performance_bonus
  for insert
  to authenticated
  with check (identity.is_admin());

-- ---- intelligence.performance_bonus_members --------------------------------------------
-- Members view their own bonus credits; administrators view and insert
-- (append-only ledger: no UPDATE/DELETE policy for any role).

alter table intelligence.performance_bonus_members enable row level security;

grant select, insert on intelligence.performance_bonus_members to authenticated;

create policy performance_bonus_members_select_own on intelligence.performance_bonus_members
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy performance_bonus_members_admin_insert on intelligence.performance_bonus_members
  for insert
  to authenticated
  with check (identity.is_admin());

-- ---- intelligence.achievement_history --------------------------------------------------
-- Members and creators view their own achievement history; administrators
-- view and insert (append-only: no UPDATE/DELETE policy for any role,
-- matching "no history is ever deleted").

alter table intelligence.achievement_history enable row level security;

grant select, insert on intelligence.achievement_history to authenticated;

create policy achievement_history_select_own on intelligence.achievement_history
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy achievement_history_admin_insert on intelligence.achievement_history
  for insert
  to authenticated
  with check (identity.is_admin());
