-- =============================================================================
-- Migration: 006_create_governance_schema.sql
--
-- Purpose:
--   Creates the governance schema — feature flags, system settings,
--   governance rules, administrator overrides, platform experiments, and AI
--   controls. The constitutional framework that lets PCGH evolve through
--   configuration and controlled activation rather than direct database
--   changes or silent feature releases.
--
-- Responsibilities:
--   - Create the `governance` schema and its 6 approved tables.
--   - Enforce documented constraints (unique, foreign key, check).
--   - Create documented indexes.
--   - Enable Row Level Security and the policies documented in
--     docs/governance-schema.md ("RLS Philosophy").
--
-- Relationships:
--   identity.users -> governance.system_settings (updated_by)
--   identity.users -> governance.admin_overrides (created_by)
--   identity.users -> governance.ai_controls (updated_by)
--
-- Notes:
--   - Unlike protection/intelligence, no table in this schema is documented
--     as a history/audit trail or marked "never deleted" -- the append-only
--     requirement is explicitly conditional ("where documented"), so all 6
--     tables here get standard mutable administrator-managed RLS. This is
--     the simplest RLS shape of any schema so far: the documented
--     philosophy is literally "Administrators may: Manage all governance
--     controls" / "Users may: Have no direct access," with no per-table
--     nuance and no self-service ("own data") concept at all, since every
--     table here is platform-wide configuration, not user-owned data.
--     "Service roles may: Read configuration, Execute controls" is already
--     satisfied by the blanket service_role grant below (service_role
--     bypasses RLS in Supabase).
--   - feature_flags, system_settings, and governance_rules document
--     flag_name / setting_name / rule_code as UNIQUE; platform_experiments'
--     experiment_name and ai_controls' ai_feature are documented WITHOUT a
--     UNIQUE annotation, so no uniqueness constraint is added for those two
--     -- the same asymmetry already seen with performance_bonus.bonus_code
--     in 005, read literally rather than assumed.
--   - feature_flag_name_idx, system_setting_name_idx, and
--     governance_rule_code_idx are covered by the implicit unique index
--     their respective UNIQUE constraints already create, so no separate
--     duplicate index is added for those three -- same reasoning as
--     wallet_user_idx in 002 and badges_name_idx in 005.
--   - Only feature_flags, system_settings, and governance_rules, and
--     ai_controls document an updated_at column; admin_overrides and
--     platform_experiments do not, so only the first four get the
--     identity.set_updated_at() trigger, per the requirement to add
--     updated_at triggers only where that column exists. system_settings
--     and ai_controls also have no documented created_at column, matching
--     the source exactly rather than adding one by analogy to other tables.
--   - Reuses identity.is_admin() and identity.set_updated_at() from
--     001_create_identity_schema.sql rather than redefining equivalent
--     helpers. identity.current_user_id() is not needed here since no
--     table in this schema has a self-service ("own") access policy.
--
-- Future expansion:
--   - Reserved schemas named in docs/governance-schema.md (audit,
--     notifications, billing, marketplace, events, ai) are not created by
--     this migration; they remain future work.
--
-- Source of truth: docs/governance-schema.md
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists governance;

comment on schema governance is
  'Feature flags, system settings, governance rules, administrator overrides, platform experiments, and AI controls. Lets PCGH evolve through configuration and controlled activation, never direct database changes or silent releases.';

-- =============================================================================
-- TABLE 1: governance.feature_flags
-- =============================================================================

create table if not exists governance.feature_flags (
  id           uuid primary key default gen_random_uuid(),
  flag_name    varchar(100) unique not null,
  enabled      boolean not null default false,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table governance.feature_flags is
  'Controls platform features via named on/off flags.';

create index if not exists feature_flag_enabled_idx on governance.feature_flags(enabled);

drop trigger if exists feature_flags_set_updated_at on governance.feature_flags;
create trigger feature_flags_set_updated_at
  before update on governance.feature_flags
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 2: governance.system_settings
-- =============================================================================

create table if not exists governance.system_settings (
  id             uuid primary key default gen_random_uuid(),
  setting_name   varchar(100) unique not null,
  setting_value  jsonb not null,
  description    text,
  updated_by     uuid references identity.users(id),
  updated_at     timestamptz not null default now()
);

comment on table governance.system_settings is
  'Global platform settings.';

drop trigger if exists system_settings_set_updated_at on governance.system_settings;
create trigger system_settings_set_updated_at
  before update on governance.system_settings
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 3: governance.governance_rules
-- =============================================================================

create table if not exists governance.governance_rules (
  id           uuid primary key default gen_random_uuid(),
  rule_code    varchar(50) unique not null,
  rule_name    varchar(255) not null,
  description  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table governance.governance_rules is
  'Platform governance rules.';

create index if not exists governance_rule_active_idx on governance.governance_rules(is_active);

drop trigger if exists governance_rules_set_updated_at on governance.governance_rules;
create trigger governance_rules_set_updated_at
  before update on governance.governance_rules
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- TABLE 4: governance.admin_overrides
-- =============================================================================

create table if not exists governance.admin_overrides (
  id             uuid primary key default gen_random_uuid(),
  override_type  varchar(100) not null,
  target_schema  varchar(100) not null,
  target_table   varchar(100) not null,
  target_id      uuid,
  reason         text,
  created_by     uuid not null references identity.users(id),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz
);

comment on table governance.admin_overrides is
  'Administrator overrides of platform rules and controls (e.g. ignore cooldown, restore community, grant bonus).';

create index if not exists admin_override_type_idx on governance.admin_overrides(override_type);
create index if not exists admin_override_target_idx on governance.admin_overrides(target_id);

-- =============================================================================
-- TABLE 5: governance.platform_experiments
-- =============================================================================

create table if not exists governance.platform_experiments (
  id                uuid primary key default gen_random_uuid(),
  experiment_name   varchar(255) not null,
  description       text,
  status            varchar(50) not null default 'draft'
                      constraint platform_experiments_status_check
                      check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  configuration     jsonb,
  started_at        timestamptz,
  ended_at          timestamptz,
  created_at        timestamptz not null default now()
);

comment on table governance.platform_experiments is
  'Supports controlled platform experimentation.';

create index if not exists experiment_name_idx on governance.platform_experiments(experiment_name);
create index if not exists experiment_status_idx on governance.platform_experiments(status);

-- =============================================================================
-- TABLE 6: governance.ai_controls
-- =============================================================================

create table if not exists governance.ai_controls (
  id             uuid primary key default gen_random_uuid(),
  ai_feature     varchar(100) not null,
  enabled        boolean not null default false,
  configuration  jsonb,
  updated_by     uuid references identity.users(id),
  updated_at     timestamptz not null default now()
);

comment on table governance.ai_controls is
  'Controls AI functionality. All AI systems remain disabled by default.';

create index if not exists ai_control_feature_idx on governance.ai_controls(ai_feature);
create index if not exists ai_control_enabled_idx on governance.ai_controls(enabled);

drop trigger if exists ai_controls_set_updated_at on governance.ai_controls;
create trigger ai_controls_set_updated_at
  before update on governance.ai_controls
  for each row execute function identity.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
--
-- Philosophy (docs/governance-schema.md "RLS Philosophy"):
--   Administrators may manage all governance controls. Users may have no
--   direct access. Service roles may read configuration and execute
--   controls (satisfied by the service_role grant below).
-- =============================================================================

grant usage on schema governance to authenticated, service_role;
grant all on all tables in schema governance to service_role;

-- ---- governance.feature_flags --------------------------------------------------

alter table governance.feature_flags enable row level security;

grant select, insert, update, delete on governance.feature_flags to authenticated;

create policy feature_flags_admin_manage on governance.feature_flags
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- governance.system_settings --------------------------------------------------

alter table governance.system_settings enable row level security;

grant select, insert, update, delete on governance.system_settings to authenticated;

create policy system_settings_admin_manage on governance.system_settings
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- governance.governance_rules --------------------------------------------------

alter table governance.governance_rules enable row level security;

grant select, insert, update, delete on governance.governance_rules to authenticated;

create policy governance_rules_admin_manage on governance.governance_rules
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- governance.admin_overrides --------------------------------------------------

alter table governance.admin_overrides enable row level security;

grant select, insert, update, delete on governance.admin_overrides to authenticated;

create policy admin_overrides_admin_manage on governance.admin_overrides
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- governance.platform_experiments --------------------------------------------------

alter table governance.platform_experiments enable row level security;

grant select, insert, update, delete on governance.platform_experiments to authenticated;

create policy platform_experiments_admin_manage on governance.platform_experiments
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());

-- ---- governance.ai_controls --------------------------------------------------

alter table governance.ai_controls enable row level security;

grant select, insert, update, delete on governance.ai_controls to authenticated;

create policy ai_controls_admin_manage on governance.ai_controls
  for all
  to authenticated
  using (identity.is_admin())
  with check (identity.is_admin());
