-- =============================================================================
-- Migration: 004_create_protection_schema.sql
--
-- Purpose:
--   Creates the protection schema — the anti-engagement-farm engine that
--   records every creator-to-community exposure, enforces cooldown periods,
--   allows communities to be excluded from distribution, and stores
--   historical community performance for administrative review.
--
-- Responsibilities:
--   - Create the `protection` schema and its 5 approved tables.
--   - Enforce documented constraints (foreign key, check), including the
--     explicitly documented cooldown_days range (1-31 days) on
--     community_cooldowns.
--   - Create documented indexes.
--   - Enable Row Level Security with administrator-only access, per the
--     reasoning in the Notes section below.
--
-- Relationships:
--   identity.users -> protection.rotation_history
--   identity.users -> protection.community_cooldowns
--   identity.users -> protection.member_cooldowns
--   identity.users -> protection.community_exclusions
--   identity.member_communities -> protection.community_performance_history
--
-- Notes:
--   - docs/protection-schema.md documents an "RLS Philosophy" scoped per
--     table (see that section): administrators have full access to every
--     table in this schema, and creators may additionally view their own
--     protection.community_exclusions records (read-only -- they cannot
--     insert, update, or delete exclusions). No other table grants any
--     creator- or member-facing access: this schema's purpose is preventing
--     gamed/artificial exposure (repetitive exposure, community fatigue,
--     suspicious patterns), and letting creators or members read
--     rotation/cooldown data would let them reverse-engineer and route
--     around rotation logic -- the same concern that kept
--     discovery.campaign_distributions administrator-only in 003.
--   - protection.rotation_history is append-only ("no records are ever
--     deleted"): administrators get SELECT and INSERT, no UPDATE/DELETE.
--   - protection.community_performance_history's only documented
--     administrative action is "Review performance history" (a read verb).
--     Administrators get SELECT only; the historical records are written by
--     the trusted backend analytics/rotation engine via service_role.
--   - The 1-31 day cooldown_days rule is documented only under
--     community_cooldowns ("## Rules"), not member_cooldowns, so it is
--     enforced only on community_cooldowns -- applying it to
--     member_cooldowns as well would be inventing a constraint the
--     documentation does not state for that table.
--   - member_cooldowns has no created_by column and community_exclusions'
--     recommended indexes list only creator/community (no expires_at
--     index); both are implemented exactly as documented, without adding
--     columns or indexes by analogy by other tables in this schema.
--   - No table in this schema documents an updated_at column, so no
--     updated_at trigger is attached anywhere in this migration.
--   - Reuses identity.is_admin() from 001_create_identity_schema.sql rather
--     than redefining an equivalent helper.
--
-- Future expansion:
--   - intelligence and analytics schemas will reference
--     protection.rotation_history(id) and
--     protection.community_performance_history(id).
--   - AI_ROTATION_ENABLED, AUTO_COOLDOWN_ENABLED, and
--     AI_COOLDOWN_OPTIMIZATION_ENABLED remain disabled platform features and
--     introduce no schema changes here.
--
-- Source of truth: docs/protection-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists protection;

comment on schema protection is
  'Anti-engagement-farm engine: rotation history, cooldowns, community exclusions, and community performance history. Protects authenticity, natural discovery, community health, and audience diversity.';

-- =============================================================================
-- TABLE 1: protection.rotation_history
-- =============================================================================

create table if not exists protection.rotation_history (
  id               uuid primary key default gen_random_uuid(),
  creator_id       uuid not null references identity.users(id),
  campaign_id      uuid not null references economy.campaigns(id),
  community_id     uuid not null references identity.member_communities(id),
  rotation_reason  varchar(100) not null
                     constraint rotation_history_reason_check
                     check (rotation_reason in (
                       'campaign_distribution', 'manual_distribution', 'bonus_distribution',
                       'retry_distribution', 'administrative_override'
                     )),
  distributed_at   timestamptz not null default now(),
  cooldown_until   timestamptz,
  created_at       timestamptz not null default now()
);

comment on table protection.rotation_history is
  'Every creator-to-community exposure. Append-only: no records are ever deleted.';

create index if not exists rotation_creator_idx on protection.rotation_history(creator_id);
create index if not exists rotation_campaign_idx on protection.rotation_history(campaign_id);
create index if not exists rotation_community_idx on protection.rotation_history(community_id);
create index if not exists rotation_cooldown_idx on protection.rotation_history(cooldown_until);

-- =============================================================================
-- TABLE 2: protection.community_cooldowns
-- =============================================================================

create table if not exists protection.community_cooldowns (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references identity.users(id),
  community_id   uuid not null references identity.member_communities(id),
  cooldown_days  integer not null
                   constraint community_cooldowns_days_check
                   check (cooldown_days >= 1 and cooldown_days <= 31),
  starts_at      timestamptz not null default now(),
  ends_at        timestamptz,
  created_by     uuid not null references identity.users(id),
  created_at     timestamptz not null default now()
);

comment on table protection.community_cooldowns is
  'Administrator-controlled cooldown periods for creator-community relationships (1-31 days).';

create index if not exists community_cooldown_creator_idx on protection.community_cooldowns(creator_id);
create index if not exists community_cooldown_community_idx on protection.community_cooldowns(community_id);
create index if not exists community_cooldown_end_idx on protection.community_cooldowns(ends_at);

-- =============================================================================
-- TABLE 3: protection.member_cooldowns
-- =============================================================================

create table if not exists protection.member_cooldowns (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references identity.users(id),
  member_id      uuid not null references identity.users(id),
  community_id   uuid not null references identity.member_communities(id),
  cooldown_days  integer not null,
  starts_at      timestamptz not null default now(),
  ends_at        timestamptz,
  created_at     timestamptz not null default now()
);

comment on table protection.member_cooldowns is
  'Prevents repeated exposure between a specific creator and a specific member.';

create index if not exists member_cooldown_creator_idx on protection.member_cooldowns(creator_id);
create index if not exists member_cooldown_member_idx on protection.member_cooldowns(member_id);
create index if not exists member_cooldown_end_idx on protection.member_cooldowns(ends_at);

-- =============================================================================
-- TABLE 4: protection.community_exclusions
-- =============================================================================

create table if not exists protection.community_exclusions (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references identity.users(id),
  community_id  uuid not null references identity.member_communities(id),
  reason        text,
  expires_at    timestamptz,
  created_by    uuid not null references identity.users(id),
  created_at    timestamptz not null default now()
);

comment on table protection.community_exclusions is
  'Excludes a community from a creator''s distribution. NULL expires_at means a permanent exclusion; a set expires_at means a temporary exclusion.';

create index if not exists exclusion_creator_idx on protection.community_exclusions(creator_id);
create index if not exists exclusion_community_idx on protection.community_exclusions(community_id);

-- =============================================================================
-- TABLE 5: protection.community_performance_history
-- =============================================================================

create table if not exists protection.community_performance_history (
  id                 uuid primary key default gen_random_uuid(),
  community_id       uuid not null references identity.member_communities(id),
  campaign_id        uuid not null references economy.campaigns(id),
  members_assigned   integer not null
                       constraint performance_history_members_assigned_check
                       check (members_assigned >= 0),
  members_viewed     integer not null
                       constraint performance_history_members_viewed_check
                       check (members_viewed >= 0),
  members_shared     integer not null
                       constraint performance_history_members_shared_check
                       check (members_shared >= 0),
  members_saved      integer not null
                       constraint performance_history_members_saved_check
                       check (members_saved >= 0),
  engagement_rate    decimal(5,2) not null,
  performance_score  decimal(5,2) not null,
  recorded_at        timestamptz not null default now()
);

comment on table protection.community_performance_history is
  'Historical community performance, used by administrators to decide cooldown periods, distribution timing, recognition, and bonus allocation.';

create index if not exists performance_community_idx on protection.community_performance_history(community_id);
create index if not exists performance_campaign_idx on protection.community_performance_history(campaign_id);
create index if not exists performance_score_idx on protection.community_performance_history(performance_score);
create index if not exists performance_recorded_idx on protection.community_performance_history(recorded_at);

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- docs/protection-schema.md documents no creator- or member-facing
-- capability anywhere ("Administrative Controls" lists only administrator
-- actions). RLS on every table in this schema is therefore
-- administrator-only -- see the Notes section above for the full reasoning.
-- =============================================================================

grant usage on schema protection to authenticated, service_role;
grant all on all tables in schema protection to service_role;

-- ---- protection.rotation_history ----------------------------------------------
-- Append-only: administrators get SELECT and INSERT, no UPDATE/DELETE.

alter table protection.rotation_history enable row level security;

grant select, insert on protection.rotation_history to authenticated;

create policy rotation_history_admin_select on protection.rotation_history
  for select
  to authenticated
  using (identity.is_admin());

create policy rotation_history_admin_insert on protection.rotation_history
  for insert
  to authenticated
  with check (identity.is_admin());

-- ---- protection.community_cooldowns --------------------------------------------
-- "Set cooldown days" / "Ignore cooldowns": full administrator management.

alter table protection.community_cooldowns enable row level security;

grant select, insert, update, delete on protection.community_cooldowns to authenticated;

create policy community_cooldowns_admin_manage on protection.community_cooldowns
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- protection.member_cooldowns -----------------------------------------------
-- Same administrator-controlled lifecycle as its sibling table above.

alter table protection.member_cooldowns enable row level security;

grant select, insert, update, delete on protection.member_cooldowns to authenticated;

create policy member_cooldowns_admin_manage on protection.member_cooldowns
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- protection.community_exclusions --------------------------------------------
-- "Exclude communities" / "Restore communities": full administrator management.
-- Creators may additionally view their own exclusion records (which
-- communities they are excluded from and why), but may not insert, update,
-- or delete them -- exclusions remain an administrator-only action.

alter table protection.community_exclusions enable row level security;

grant select, insert, update, delete on protection.community_exclusions to authenticated;

create policy community_exclusions_admin_manage on protection.community_exclusions
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy community_exclusions_creator_select on protection.community_exclusions
  for select
  to authenticated
  using (creator_id = identity.current_user_id());

-- ---- protection.community_performance_history -------------------------------------
-- "Review performance history" is a read-only administrative capability;
-- records are written by the trusted backend analytics/rotation engine via
-- service_role.

alter table protection.community_performance_history enable row level security;

grant select on protection.community_performance_history to authenticated;

create policy community_performance_history_admin_select on protection.community_performance_history
  for select
  to authenticated
  using (identity.is_admin());
