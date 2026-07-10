-- =============================================================================
-- Migration: 003_create_discovery_schema.sql
--
-- Purpose:
--   Creates the discovery schema — the core PCGH intellectual property that
--   transforms creator campaigns into community discovery opportunities,
--   assigns them to communities and members, and records a permanent audit
--   trail of discovery activity.
--
-- Responsibilities:
--   - Create the `discovery` schema and its 4 approved tables.
--   - Enforce documented constraints (foreign key, check) and the
--     non-negative invariant implied by the documented member-count columns.
--   - Create documented indexes.
--   - Enable Row Level Security and the policies documented in
--     docs/discovery-schema.md ("RLS Philosophy").
--
-- Relationships:
--   economy.campaigns -> discovery.discovery_opportunities
--   discovery.discovery_opportunities -> discovery.community_assignments
--   discovery.community_assignments -> discovery.member_assignments
--   discovery.member_assignments -> discovery.assignment_history
--
-- Notes:
--   - The documented RLS Philosophy for this schema is exclusively "View"
--     for members and creators, and "View everything" for administrators --
--     no create/update/manage verb appears anywhere in it. All four tables
--     are therefore read-only through RLS for authenticated users; rows are
--     written exclusively by trusted backend services (the campaign-to-
--     discovery and rotation/assignment engines) using the service_role key,
--     which bypasses RLS.
--   - discovery.assignment_history is a permanent audit trail: no
--     UPDATE/DELETE policy exists for any role, matching "no history is
--     ever deleted."
--   - Access is scoped per table exactly as documented, not broadened by
--     inference: creators see discovery_opportunities (own campaign
--     discoveries) and community_assignments (own analytics, via the
--     opportunities they created); members see member_assignments and
--     assignment_history (their own rows only). Neither role is granted
--     access to a table the philosophy does not name for them.
--   - None of the four tables document a created_at/updated_at pair beyond
--     what's listed below; discovery.community_assignments and
--     discovery.member_assignments have no updated_at column in the source
--     documentation, so none is added here, and no updated_at trigger is
--     attached to them.
--   - Reuses identity.current_user_id(), identity.is_admin(), and
--     identity.set_updated_at() from 001_create_identity_schema.sql rather
--     than redefining equivalent helpers.
--
-- Future expansion:
--   - protection, intelligence, and analytics schemas will reference
--     discovery.discovery_opportunities(id) and discovery.assignment_history(id).
--   - SELECTIVE_ASSIGNMENT_ENABLED, AI_AUDIENCE_MATCHING_ENABLED, and
--     AI_DISCOVERY_OPTIMIZATION_ENABLED remain disabled platform features
--     and introduce no schema changes here.
--
-- Source of truth: docs/discovery-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists discovery;

comment on schema discovery is
  'Transforms creator campaigns into community discovery opportunities and tracks their assignment to communities and members. Core PCGH intellectual property: discovery, not tasks.';

-- =============================================================================
-- TABLE 1: discovery.discovery_opportunities
-- =============================================================================

create table if not exists discovery.discovery_opportunities (
  id                uuid primary key default gen_random_uuid(),
  opportunity_code  varchar(30) unique not null,
  campaign_id       uuid not null references economy.campaigns(id),
  creator_id        uuid not null references identity.users(id),
  campaign_type     varchar(50) not null
                      constraint discovery_opportunities_campaign_type_check
                      check (campaign_type in ('creator', 'business', 'ministry', 'organization', 'educational')),
  title             varchar(255) not null,
  description       text,
  content_url       text,
  platform          varchar(50),
  content_type      varchar(50),
  status            varchar(50) not null default 'draft'
                      constraint discovery_opportunities_status_check
                      check (status in ('draft', 'scheduled', 'active', 'expired', 'archived')),
  starts_at         timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table discovery.discovery_opportunities is
  'Discovery opportunities created from campaigns. PCGH distributes discovery, not tasks.';

create index if not exists opportunity_campaign_idx on discovery.discovery_opportunities(campaign_id);
create index if not exists opportunity_creator_idx on discovery.discovery_opportunities(creator_id);
create index if not exists opportunity_status_idx on discovery.discovery_opportunities(status);
create index if not exists opportunity_created_idx on discovery.discovery_opportunities(created_at);

drop trigger if exists discovery_opportunities_set_updated_at on discovery.discovery_opportunities;
create trigger discovery_opportunities_set_updated_at
  before update on discovery.discovery_opportunities
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 2: discovery.community_assignments
-- =============================================================================

create table if not exists discovery.community_assignments (
  id                 uuid primary key default gen_random_uuid(),
  opportunity_id     uuid not null references discovery.discovery_opportunities(id),
  community_id       uuid not null references identity.member_communities(id),
  members_assigned   integer not null default 0
                       constraint community_assignments_members_assigned_check
                       check (members_assigned >= 0),
  members_viewed     integer not null default 0
                       constraint community_assignments_members_viewed_check
                       check (members_viewed >= 0),
  members_shared     integer not null default 0
                       constraint community_assignments_members_shared_check
                       check (members_shared >= 0),
  members_saved      integer not null default 0
                       constraint community_assignments_members_saved_check
                       check (members_saved >= 0),
  performance_score  decimal(5,2),
  assigned_at        timestamptz not null default now(),
  status             varchar(50) not null default 'assigned'
                       constraint community_assignments_status_check
                       check (status in ('assigned', 'active', 'completed', 'expired', 'cancelled'))
);

comment on table discovery.community_assignments is
  'Assigns discovery opportunities to communities and tracks community-level performance.';

create index if not exists community_assignment_opportunity_idx on discovery.community_assignments(opportunity_id);
create index if not exists community_assignment_community_idx on discovery.community_assignments(community_id);
create index if not exists community_assignment_status_idx on discovery.community_assignments(status);

-- =============================================================================
-- TABLE 3: discovery.member_assignments
-- =============================================================================

create table if not exists discovery.member_assignments (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references discovery.discovery_opportunities(id),
  community_id    uuid not null references identity.member_communities(id),
  user_id         uuid not null references identity.users(id),
  assigned_at     timestamptz not null default now(),
  viewed_at       timestamptz,
  visited_at      timestamptz,
  shared_at       timestamptz,
  saved_at        timestamptz,
  ignored_at      timestamptz,
  completed_at    timestamptz,
  status          varchar(50) not null default 'assigned'
                    constraint member_assignments_status_check
                    check (status in ('assigned', 'viewed', 'visited', 'shared', 'saved', 'ignored', 'completed', 'expired'))
);

comment on table discovery.member_assignments is
  'Tracks discovery opportunities delivered to individual members. One assigned community means all of its members receive the opportunity.';

create index if not exists member_assignment_user_idx on discovery.member_assignments(user_id);
create index if not exists member_assignment_community_idx on discovery.member_assignments(community_id);
create index if not exists member_assignment_opportunity_idx on discovery.member_assignments(opportunity_id);
create index if not exists member_assignment_status_idx on discovery.member_assignments(status);

-- =============================================================================
-- TABLE 4: discovery.assignment_history
-- =============================================================================

create table if not exists discovery.assignment_history (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references discovery.discovery_opportunities(id),
  community_id    uuid not null references identity.member_communities(id),
  user_id         uuid not null references identity.users(id),
  action          varchar(50) not null
                    constraint assignment_history_action_check
                    check (action in ('received', 'viewed', 'visited', 'shared', 'saved', 'ignored', 'completed')),
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

comment on table discovery.assignment_history is
  'Permanent audit trail for discovery activity. Append-only: no history is ever deleted.';

create index if not exists assignment_history_user_idx on discovery.assignment_history(user_id);
create index if not exists assignment_history_opportunity_idx on discovery.assignment_history(opportunity_id);
create index if not exists assignment_history_action_idx on discovery.assignment_history(action);
create index if not exists assignment_history_created_idx on discovery.assignment_history(created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- Philosophy (docs/discovery-schema.md "RLS Philosophy"):
--   Members may view their own assignments and their own discovery history.
--   Creators may view their own campaign discoveries and their own analytics.
--   Administrators may view everything.
-- =============================================================================

grant usage on schema discovery to authenticated, service_role;
grant all on all tables in schema discovery to service_role;

-- ---- discovery.discovery_opportunities ----------------------------------------
-- Creators view their own campaign discoveries; administrators view all.
-- No INSERT/UPDATE/DELETE policy: opportunities are generated from campaigns
-- exclusively by trusted backend services via service_role.

alter table discovery.discovery_opportunities enable row level security;

grant select on discovery.discovery_opportunities to authenticated;

create policy discovery_opportunities_select_own on discovery.discovery_opportunities
  for select
  to authenticated
  using (creator_id = identity.current_user_id() or identity.is_admin());

-- ---- discovery.community_assignments --------------------------------------------
-- Creators view their own analytics (community-level performance for
-- opportunities they created); administrators view all. No creator-facing
-- policy is granted to members, who receive individual assignments instead.

alter table discovery.community_assignments enable row level security;

grant select on discovery.community_assignments to authenticated;

create policy community_assignments_select_own on discovery.community_assignments
  for select
  to authenticated
  using (
    identity.is_admin()
    or opportunity_id in (
      select id from discovery.discovery_opportunities where creator_id = identity.current_user_id()
    )
  );

-- ---- discovery.member_assignments -----------------------------------------------
-- Members view their own assignments; administrators view all. No
-- creator-facing policy: the documented boundary routes creator visibility
-- through community_assignments analytics, not individual member rows.

alter table discovery.member_assignments enable row level security;

grant select on discovery.member_assignments to authenticated;

create policy member_assignments_select_own on discovery.member_assignments
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

-- ---- discovery.assignment_history -----------------------------------------------
-- Members view their own discovery history; administrators view all. No
-- INSERT/UPDATE/DELETE policy exists for any role: entries are written
-- exclusively by trusted backend services via service_role.

alter table discovery.assignment_history enable row level security;

grant select on discovery.assignment_history to authenticated;

create policy assignment_history_select_own on discovery.assignment_history
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());
