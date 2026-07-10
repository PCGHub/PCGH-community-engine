-- =============================================================================
-- Migration: 001_create_identity_schema.sql
--
-- Purpose:
--   Creates the identity schema — the foundational identity architecture for
--   the entire PCGH platform (user identities, roles, creator circles, and
--   member communities).
--
-- Responsibilities:
--   - Create the `identity` schema and its 7 approved tables.
--   - Enforce documented constraints (unique, check, foreign key).
--   - Create documented indexes.
--   - Enable Row Level Security and the RLS policies documented in
--     docs/identity-schema.md ("RLS Philosophy").
--
-- Relationships:
--   auth.users -> identity.users -> identity.user_roles
--   identity.users -> identity.creator_circle_members -> identity.creator_circles
--   identity.users -> identity.member_community_members -> identity.member_communities
--   identity.member_communities -> identity.community_member_history
--
-- Notes:
--   - identity.users.id is the root dependency for every other PCGH schema.
--   - identity.community_member_history is append-only: no UPDATE/DELETE
--     policies are defined for any role, matching the documented rule that
--     history records are never updated or deleted.
--
-- Future expansion:
--   - Additional schemas (economy, discovery, protection, intelligence,
--     analytics) will reference identity.users(id) via foreign keys.
--
-- Source of truth: docs/identity-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists identity;

comment on schema identity is
  'Foundational identity architecture for PCGH: user identities, roles, creator circles, and member communities. All other schemas depend on identity.users.id.';

-- =============================================================================
-- TABLE 1: identity.users
-- =============================================================================

create table if not exists identity.users (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid unique references auth.users(id),
  user_code       varchar(20) unique not null,
  email           varchar(255) unique not null,
  username        varchar(50) unique not null,
  full_name       varchar(255),
  avatar_url      text,
  phone           varchar(30),
  country         varchar(100),
  timezone        varchar(100),
  status          varchar(30) not null default 'pending'
                    constraint users_status_check
                    check (status in ('active', 'pending', 'suspended', 'deleted')),
  email_verified  boolean not null default false,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table identity.users is
  'Master user record for the PCGH platform. Root dependency for every other schema.';

create index if not exists users_email_idx on identity.users(email);
create index if not exists users_username_idx on identity.users(username);
create index if not exists users_status_idx on identity.users(status);
create index if not exists users_created_at_idx on identity.users(created_at);

-- =============================================================================
-- TABLE 2: identity.user_roles
-- =============================================================================

create table if not exists identity.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references identity.users(id),
  role_name   varchar(50) not null
                constraint user_roles_role_name_check
                check (role_name in ('member', 'creator', 'admin')),
  created_at  timestamptz not null default now(),
  constraint user_roles_user_role_unique unique (user_id, role_name)
);

comment on table identity.user_roles is
  'Supports multiple roles per user (member, creator, admin).';

create index if not exists user_roles_user_idx on identity.user_roles(user_id);
create index if not exists user_roles_role_idx on identity.user_roles(role_name);

-- =============================================================================
-- TABLE 3: identity.creator_circles
-- =============================================================================

create table if not exists identity.creator_circles (
  id            uuid primary key default gen_random_uuid(),
  circle_code   varchar(20) unique not null,
  name          varchar(255) not null,
  member_count  integer not null default 0
                  constraint creator_circles_member_count_check
                  check (member_count >= 0 and member_count <= 100),
  status        varchar(30) not null default 'active'
                  constraint creator_circles_status_check
                  check (status in ('active', 'archived', 'locked')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table identity.creator_circles is
  'Creator communities. Maximum 100 creators per circle; circles are created automatically.';

create index if not exists creator_circles_status_idx on identity.creator_circles(status);
create index if not exists creator_circles_member_count_idx on identity.creator_circles(member_count);

-- =============================================================================
-- TABLE 4: identity.creator_circle_members
-- =============================================================================

create table if not exists identity.creator_circle_members (
  id          uuid primary key default gen_random_uuid(),
  circle_id   uuid not null references identity.creator_circles(id),
  user_id     uuid not null references identity.users(id),
  joined_at   timestamptz not null default now(),
  constraint creator_circle_members_user_unique unique (user_id)
);

comment on table identity.creator_circle_members is
  'Links creators to creator circles. A creator belongs to exactly one circle at a time.';

create index if not exists creator_circle_members_circle_idx on identity.creator_circle_members(circle_id);

-- =============================================================================
-- TABLE 5: identity.member_communities
-- =============================================================================

create table if not exists identity.member_communities (
  id              uuid primary key default gen_random_uuid(),
  community_code  varchar(20) unique not null,
  name            varchar(255) not null,
  member_count    integer not null default 0
                    constraint member_communities_member_count_check
                    check (member_count >= 0 and member_count <= 100),
  status          varchar(30) not null default 'active'
                    constraint member_communities_status_check
                    check (status in ('active', 'archived', 'locked')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table identity.member_communities is
  'Member community groups. Maximum 100 members per community; communities are created automatically.';

create index if not exists member_communities_status_idx on identity.member_communities(status);
create index if not exists member_communities_member_count_idx on identity.member_communities(member_count);

-- =============================================================================
-- TABLE 6: identity.member_community_members
-- =============================================================================

create table if not exists identity.member_community_members (
  id            uuid primary key default gen_random_uuid(),
  community_id  uuid not null references identity.member_communities(id),
  user_id       uuid not null references identity.users(id),
  joined_at     timestamptz not null default now(),
  constraint member_community_members_user_unique unique (user_id)
);

comment on table identity.member_community_members is
  'Links members to member communities. A member belongs to exactly one community at a time.';

create index if not exists member_community_members_community_idx on identity.member_community_members(community_id);

-- =============================================================================
-- TABLE 7: identity.community_member_history
-- =============================================================================

create table if not exists identity.community_member_history (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references identity.users(id),
  community_id     uuid not null references identity.member_communities(id),
  assignment_type  varchar(50) not null
                     constraint community_member_history_assignment_type_check
                     check (assignment_type in ('automatic', 'manual', 'migration', 'administrative')),
  assigned_by      uuid references identity.users(id),
  joined_at        timestamptz not null,
  left_at          timestamptz,
  reason           text,
  created_at       timestamptz not null default now()
);

comment on table identity.community_member_history is
  'Complete historical record of member community assignments. Append-only: records are never updated or deleted.';

create index if not exists community_history_user_idx on identity.community_member_history(user_id);
create index if not exists community_history_community_idx on identity.community_member_history(community_id);
create index if not exists community_history_joined_idx on identity.community_member_history(joined_at);
create index if not exists community_history_left_idx on identity.community_member_history(left_at);

-- =============================================================================
-- MAINTENANCE: updated_at bookkeeping
-- =============================================================================

create or replace function identity.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on identity.users;
create trigger users_set_updated_at
  before update on identity.users
  for each row execute function identity.set_updated_at();

drop trigger if exists creator_circles_set_updated_at on identity.creator_circles;
create trigger creator_circles_set_updated_at
  before update on identity.creator_circles
  for each row execute function identity.set_updated_at();

drop trigger if exists member_communities_set_updated_at on identity.member_communities;
create trigger member_communities_set_updated_at
  before update on identity.member_communities
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- RLS HELPER FUNCTIONS
--
-- These resolve the calling auth.uid() to its identity.users row and its
-- admin status, so policies below can stay declarative and DRY.
-- =============================================================================

create or replace function identity.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = identity, pg_temp
as $$
  select id from identity.users where auth_user_id = auth.uid();
$$;

comment on function identity.current_user_id() is
  'Resolves the calling auth.uid() to its identity.users.id for use in RLS policies.';

create or replace function identity.is_admin()
returns boolean
language sql
stable
security definer
set search_path = identity, pg_temp
as $$
  select exists (
    select 1
    from identity.user_roles
    where user_id = identity.current_user_id()
      and role_name = 'admin'
  );
$$;

comment on function identity.is_admin() is
  'Returns true when the calling user holds the admin role, for use in RLS policies.';

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- Philosophy (docs/identity-schema.md "RLS Philosophy"):
--   Users may view/update their own profile.
--   Creators may view their own creator circle.
--   Members may view their own community.
--   Administrators may view and manage everything.
--   identity.community_member_history is append-only for every role.
-- =============================================================================

grant usage on schema identity to authenticated, service_role;
grant all on all tables in schema identity to service_role;

-- ---- identity.users ---------------------------------------------------------

alter table identity.users enable row level security;

grant select, insert, update, delete on identity.users to authenticated;

create policy users_select_own on identity.users
  for select
  to authenticated
  using (auth_user_id = auth.uid() or identity.is_admin());

create policy users_update_own on identity.users
  for update
  to authenticated
  using (auth_user_id = auth.uid() or identity.is_admin())
  with check (auth_user_id = auth.uid() or identity.is_admin());

create policy users_admin_insert on identity.users
  for insert
  to authenticated
  with check (identity.is_admin());

create policy users_admin_delete on identity.users
  for delete
  to authenticated
  using (identity.is_admin());

-- ---- identity.user_roles ----------------------------------------------------

alter table identity.user_roles enable row level security;

grant select, insert, update, delete on identity.user_roles to authenticated;

create policy user_roles_select_own on identity.user_roles
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy user_roles_admin_manage on identity.user_roles
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- identity.creator_circles ------------------------------------------------

alter table identity.creator_circles enable row level security;

grant select, insert, update, delete on identity.creator_circles to authenticated;

create policy creator_circles_select_own on identity.creator_circles
  for select
  to authenticated
  using (
    identity.is_admin()
    or id in (
      select circle_id
      from identity.creator_circle_members
      where user_id = identity.current_user_id()
    )
  );

create policy creator_circles_admin_manage on identity.creator_circles
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- identity.creator_circle_members ------------------------------------------

alter table identity.creator_circle_members enable row level security;

grant select, insert, update, delete on identity.creator_circle_members to authenticated;

create policy creator_circle_members_select_own on identity.creator_circle_members
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy creator_circle_members_admin_manage on identity.creator_circle_members
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- identity.member_communities ----------------------------------------------

alter table identity.member_communities enable row level security;

grant select, insert, update, delete on identity.member_communities to authenticated;

create policy member_communities_select_own on identity.member_communities
  for select
  to authenticated
  using (
    identity.is_admin()
    or id in (
      select community_id
      from identity.member_community_members
      where user_id = identity.current_user_id()
    )
  );

create policy member_communities_admin_manage on identity.member_communities
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- identity.member_community_members -----------------------------------------

alter table identity.member_community_members enable row level security;

grant select, insert, update, delete on identity.member_community_members to authenticated;

create policy member_community_members_select_own on identity.member_community_members
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy member_community_members_admin_manage on identity.member_community_members
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- identity.community_member_history -----------------------------------------
-- Append-only for every role: no UPDATE or DELETE policy is defined, so RLS
-- blocks those commands outright regardless of role, per the documented rule
-- that history records are never updated or deleted.

alter table identity.community_member_history enable row level security;

grant select, insert on identity.community_member_history to authenticated;

create policy community_member_history_select_own on identity.community_member_history
  for select
  to authenticated
  using (user_id = identity.current_user_id() or identity.is_admin());

create policy community_member_history_admin_insert on identity.community_member_history
  for insert
  to authenticated
  with check (identity.is_admin());
