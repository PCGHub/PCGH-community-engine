-- =============================================================================
-- Migration: 006_create_analytics_schema.sql
--
-- Purpose:
--   Creates the analytics schema — aggregated member/community/creator
--   performance rollups, platform-wide metrics, a governed platform event
--   log, and generated reports. The measurement and intelligence foundation
--   of the PCGH operating system, and the intended persistence layer behind
--   the API Schema's future materialized views.
--
-- Responsibilities:
--   - Create the `analytics` schema and its 6 approved tables.
--   - Enforce documented constraints (unique, foreign key, check).
--   - Create documented indexes.
--   - Enable Row Level Security and the policies documented in
--     docs/analytics-schema.md ("RLS Philosophy").
--
-- Relationships:
--   identity.users -> analytics.member_analytics
--   identity.users -> analytics.creator_analytics
--   identity.member_communities -> analytics.community_analytics
--   identity.users -> analytics.analytics_events (user_id, nullable)
--   identity.users -> analytics.analytics_reports (generated_by)
--
--   Per docs/analytics-schema.md ("Analytics Relationships"), analytics is a
--   rollup layer, not a primary source of data: member_analytics,
--   community_analytics, and creator_analytics are populated from
--   discovery/protection/economy schema activity by service-role aggregation
--   jobs, not via foreign keys to those schemas. Only the community_analytics
--   RLS policy below reaches into discovery.discovery_opportunities /
--   community_assignments, to resolve which communities participate in a
--   given creator's campaigns.
--
-- Notes:
--   - No table in this schema documents an `updated_at` column (the
--     per-entity rollups document `last_updated` instead, and
--     platform_analytics documents `recorded_at`). Per the requirement to
--     add updated_at triggers only where that column exists, no
--     identity.set_updated_at() trigger is attached to any table here.
--     `last_updated` is set explicitly by the service-role aggregation job
--     that recomputes the row, matching the precedent already set by
--     intelligence.member_reputation.last_updated in 005, which likewise
--     receives no trigger.
--   - member_analytics_user_idx, community_analytics_idx, and
--     creator_analytics_idx are covered by the implicit unique index their
--     respective UNIQUE constraints already create, so no separate duplicate
--     index is added for those three -- same reasoning as wallet_user_idx in
--     002, badges_name_idx in 005, and feature_flag_name_idx in 007.
--   - analytics_events.event_type is documented as "a governed vocabulary,
--     not a free-text field," so it gets an explicit CHECK constraint
--     enumerating the seven approved values, matching the same treatment
--     already given to intelligence.achievement_history.event_type in 005.
--     entity_type has no documented enumeration, so it is left as an
--     unconstrained varchar, matching the instruction not to add
--     constraints beyond what is documented.
--   - platform_analytics, analytics_events, and analytics_reports are
--     documented in "Partitioning Strategy" as append-only,
--     unbounded-growth tables, so each gets administrator SELECT + INSERT
--     only (no UPDATE/DELETE policy for any role), matching the append-only
--     pattern already used for intelligence.performance_bonus and
--     intelligence.achievement_history in 005. member_analytics,
--     community_analytics, and creator_analytics are explicitly excluded
--     from partitioning as single-row-per-entity rollups, so they receive
--     full administrator manage (select/insert/update/delete), matching
--     intelligence.member_reputation / creator_reputation /
--     community_reputation.
--   - Per the documented RLS Philosophy ("Analytics tables are written by
--     service-role aggregation jobs, not by end users"), no member or
--     creator policy ever grants INSERT/UPDATE/DELETE -- self-access is
--     SELECT-only in every case. Service-role writes are already satisfied
--     by the blanket service_role grant below (service_role bypasses RLS in
--     Supabase), consistent with the same note in 007.
--   - community_analytics has no member-facing policy at all: the
--     documented RLS Philosophy states "Members may: No direct access."
--     Creators may view analytics only for communities participating in
--     their own campaigns, resolved via discovery.community_assignments
--     joined to discovery.discovery_opportunities on creator_id. This path
--     was chosen over economy.campaign_distributions / economy.campaigns:
--     campaign_distributions has no creator-facing RLS policy at all (see
--     002, admin-only by design), so a subquery through it would silently
--     return zero rows for every creator. discovery.community_assignments
--     already grants creators SELECT access to their own opportunities'
--     assignments (see 003), and is one of the two tables this table is
--     documented as being sourced from, so it composes correctly under RLS.
--   - The documented "Future Community Managers may: View analytics for
--     communities they manage" policy is NOT implemented in this migration.
--     No `community_manager` role exists in identity.user_roles (the
--     approved roles are member, creator, admin per docs/identity-schema.md
--     "Allowed Roles"), and no "managed communities" relationship exists in
--     any locked schema. Implementing this policy now would require
--     inventing a role and a table that are not part of the approved
--     architecture. This is flagged for the architecture review below
--     rather than implemented speculatively.
--   - Reuses identity.current_user_id() and identity.is_admin() from
--     001_create_identity_schema.sql rather than redefining equivalent
--     helpers. identity.set_updated_at() is not used here (see above).
--
-- Future expansion:
--   - api-schema.md's future materialized view candidates
--     (creator_statistics_mv, community_statistics_mv,
--     daily_platform_statistics_mv) are documented to read from
--     creator_analytics, community_analytics, and platform_analytics
--     respectively, rather than re-aggregating source schemas
--     independently.
--   - Retention and partitioning for analytics_events should be planned
--     alongside intelligence.achievement_history, per docs/analytics-schema.md
--     ("Partitioning Strategy"); neither is implemented as a partitioned
--     table in this migration.
--   - AI_ANALYTICS_ENABLED and AI_ANALYTICS are governed exclusively by
--     governance.feature_flags and governance.ai_controls (007); this
--     migration introduces no local feature-flag columns or tables.
--
-- Source of truth: docs/analytics-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists analytics;

comment on schema analytics is
  'Aggregated member/community/creator performance rollups, platform-wide metrics, a governed platform event log, and generated reports. A rollup layer over identity, economy, discovery, protection, and intelligence -- never their source of truth.';

-- =============================================================================
-- TABLE 1: analytics.member_analytics
-- =============================================================================

create table if not exists analytics.member_analytics (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references identity.users(id),
  discoveries_received   integer not null default 0,
  discoveries_viewed     integer not null default 0,
  discoveries_shared     integer not null default 0,
  discoveries_saved      integer not null default 0,
  participation_rate     decimal(10,2) not null default 0.00,
  last_updated           timestamptz not null default now(),
  created_at             timestamptz not null default now(),
  constraint member_analytics_user_unique unique (user_id)
);

comment on table analytics.member_analytics is
  'Aggregated member performance rollup. One record per member, sourced from discovery.member_assignments.';

create index if not exists member_analytics_participation_idx on analytics.member_analytics(participation_rate);
create index if not exists member_analytics_created_idx on analytics.member_analytics(created_at);

-- =============================================================================
-- TABLE 2: analytics.community_analytics
-- =============================================================================

create table if not exists analytics.community_analytics (
  id                    uuid primary key default gen_random_uuid(),
  community_id          uuid not null references identity.member_communities(id),
  campaigns_received    integer not null default 0,
  discoveries_viewed    integer not null default 0,
  discoveries_shared    integer not null default 0,
  discoveries_saved     integer not null default 0,
  participation_rate    decimal(10,2) not null default 0.00,
  last_updated          timestamptz not null default now(),
  created_at            timestamptz not null default now(),
  constraint community_analytics_community_unique unique (community_id)
);

comment on table analytics.community_analytics is
  'Aggregated community performance rollup. One record per community, sourced from discovery.community_assignments and protection.community_performance_history.';

create index if not exists community_analytics_participation_idx on analytics.community_analytics(participation_rate);
create index if not exists community_analytics_created_idx on analytics.community_analytics(created_at);

-- =============================================================================
-- TABLE 3: analytics.creator_analytics
-- =============================================================================

create table if not exists analytics.creator_analytics (
  id                     uuid primary key default gen_random_uuid(),
  creator_id             uuid not null references identity.users(id),
  campaigns_created      integer not null default 0,
  communities_reached    integer not null default 0,
  members_reached        integer not null default 0,
  views_generated        integer not null default 0,
  shares_generated       integer not null default 0,
  saves_generated        integer not null default 0,
  amplification_score    decimal(10,2) not null default 0.00,
  last_updated           timestamptz not null default now(),
  created_at             timestamptz not null default now(),
  constraint creator_analytics_creator_unique unique (creator_id)
);

comment on table analytics.creator_analytics is
  'Aggregated creator performance rollup. One record per creator, sourced from economy.campaigns and discovery.discovery_opportunities / community_assignments. No foreign key to a single campaign -- aggregates across all of a creator''s campaigns.';

create index if not exists creator_amplification_idx on analytics.creator_analytics(amplification_score);
create index if not exists creator_analytics_created_idx on analytics.creator_analytics(created_at);

-- =============================================================================
-- TABLE 4: analytics.platform_analytics
-- =============================================================================

create table if not exists analytics.platform_analytics (
  id            uuid primary key default gen_random_uuid(),
  metric_name   varchar(100) not null,
  metric_value  bigint not null,
  recorded_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

comment on table analytics.platform_analytics is
  'Platform-wide metric snapshots (e.g. TOTAL_USERS, TOTAL_CAMPAIGNS). Append-only; recorded_at is the metric''s as-of timestamp and may be backfilled, created_at is when the row was written.';

create index if not exists platform_metric_idx on analytics.platform_analytics(metric_name);
create index if not exists platform_recorded_idx on analytics.platform_analytics(recorded_at);
create index if not exists platform_analytics_created_idx on analytics.platform_analytics(created_at);

-- =============================================================================
-- TABLE 5: analytics.analytics_events
-- =============================================================================

create table if not exists analytics.analytics_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    varchar(100) not null
                  constraint analytics_events_event_type_check
                  check (event_type in (
                    'USER_CREATED', 'CAMPAIGN_CREATED', 'DISCOVERY_ASSIGNED',
                    'DISCOVERY_VIEWED', 'DISCOVERY_SHARED', 'BONUS_GRANTED',
                    'BADGE_AWARDED'
                  )),
  user_id       uuid references identity.users(id),
  entity_type   varchar(100),
  entity_id     uuid,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);

comment on table analytics.analytics_events is
  'Platform-wide superset event log -- the future AI and analytics foundation. Append-only. event_type is a governed vocabulary; new values must be added to this constraint before being emitted.';

create index if not exists analytics_event_type_idx on analytics.analytics_events(event_type);
create index if not exists analytics_event_user_idx on analytics.analytics_events(user_id);
create index if not exists analytics_event_created_idx on analytics.analytics_events(created_at);
create index if not exists analytics_event_entity_idx on analytics.analytics_events(entity_type, entity_id);

-- =============================================================================
-- TABLE 6: analytics.analytics_reports
-- =============================================================================

create table if not exists analytics.analytics_reports (
  id             uuid primary key default gen_random_uuid(),
  report_name    varchar(255) not null,
  report_type    varchar(100) not null,
  generated_by   uuid not null references identity.users(id),
  report_data    jsonb not null,
  created_at     timestamptz not null default now()
);

comment on table analytics.analytics_reports is
  'Generated reports (e.g. Community Performance, Monthly Platform Report). Append-only.';

create index if not exists analytics_report_type_idx on analytics.analytics_reports(report_type);
create index if not exists analytics_report_creator_idx on analytics.analytics_reports(generated_by);

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- Philosophy (docs/analytics-schema.md "RLS Philosophy"):
--   Members and creators may view their own member_analytics /
--   creator_analytics. community_analytics has no member access; creators
--   may view it only for communities participating in their own campaigns;
--   administrators may view all of it. platform_analytics and
--   analytics_events are administrator-only. analytics_reports may be
--   viewed by the generating user and administrators. No role other than
--   the service role and administrators may INSERT or UPDATE any table in
--   this schema.
-- =============================================================================

grant usage on schema analytics to authenticated, service_role;
grant all on all tables in schema analytics to service_role;

-- ---- analytics.member_analytics ----------------------------------------------

alter table analytics.member_analytics enable row level security;

grant select, insert, update, delete on analytics.member_analytics to authenticated;

create policy member_analytics_select_own on analytics.member_analytics
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy member_analytics_admin_insert on analytics.member_analytics
  for insert
  to authenticated
  with check (identity.is_admin());

create policy member_analytics_admin_update on analytics.member_analytics
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy member_analytics_admin_delete on analytics.member_analytics
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- analytics.community_analytics --------------------------------------------
-- No member policy: RLS Philosophy documents "Members may: No direct access."

alter table analytics.community_analytics enable row level security;

grant select, insert, update, delete on analytics.community_analytics to authenticated;

create policy community_analytics_select_creator on analytics.community_analytics
  for select
  to authenticated
  using (
    identity.is_admin()
    or community_id in (
      select ca.community_id
      from discovery.community_assignments ca
      join discovery.discovery_opportunities do_ on do_.id = ca.opportunity_id
      where do_.creator_id = identity.current_user_id()
    )
  );

create policy community_analytics_admin_insert on analytics.community_analytics
  for insert
  to authenticated
  with check (identity.is_admin());

create policy community_analytics_admin_update on analytics.community_analytics
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy community_analytics_admin_delete on analytics.community_analytics
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- analytics.creator_analytics ----------------------------------------------

alter table analytics.creator_analytics enable row level security;

grant select, insert, update, delete on analytics.creator_analytics to authenticated;

create policy creator_analytics_select_own on analytics.creator_analytics
  for select
  to authenticated
  using (creator_id = identity.current_user_id() or identity.is_admin());

create policy creator_analytics_admin_insert on analytics.creator_analytics
  for insert
  to authenticated
  with check (identity.is_admin());

create policy creator_analytics_admin_update on analytics.creator_analytics
  for update
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

create policy creator_analytics_admin_delete on analytics.creator_analytics
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- analytics.platform_analytics ----------------------------------------------
-- Administrator-only, append-only (no UPDATE/DELETE policy for any role).

alter table analytics.platform_analytics enable row level security;

grant select, insert on analytics.platform_analytics to authenticated;

create policy platform_analytics_admin_select on analytics.platform_analytics
  for select
  to authenticated
  using (identity.is_admin());

create policy platform_analytics_admin_insert on analytics.platform_analytics
  for insert
  to authenticated
  with check (identity.is_admin());

-- ---- analytics.analytics_events ----------------------------------------------
-- Administrator-only, append-only. Members and creators may not query this
-- table directly, per the documented RLS Philosophy.

alter table analytics.analytics_events enable row level security;

grant select, insert on analytics.analytics_events to authenticated;

create policy analytics_events_admin_select on analytics.analytics_events
  for select
  to authenticated
  using (identity.is_admin());

create policy analytics_events_admin_insert on analytics.analytics_events
  for insert
  to authenticated
  with check (identity.is_admin());

-- ---- analytics.analytics_reports ----------------------------------------------
-- Generating user and administrators may view; append-only (no UPDATE/DELETE
-- policy for any role).

alter table analytics.analytics_reports enable row level security;

grant select, insert on analytics.analytics_reports to authenticated;

create policy analytics_reports_select_own on analytics.analytics_reports
  for select
  to authenticated
  using (generated_by = identity.current_user_id() or identity.is_admin());

create policy analytics_reports_admin_insert on analytics.analytics_reports
  for insert
  to authenticated
  with check (identity.is_admin());
