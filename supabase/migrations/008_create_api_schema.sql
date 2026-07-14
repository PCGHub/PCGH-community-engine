-- =============================================================================
-- Migration: 008_create_api_schema.sql
--
-- Purpose:
--   Creates the api schema — the secure, reusable database interface layer
--   over identity, economy, discovery, protection, intelligence, analytics,
--   and governance. Owns no business data: exposes Views, SQL Functions, and
--   Stored Procedures only.
--
-- Responsibilities:
--   - Create the `api` schema.
--   - Create all 11 documented Views (security_invoker = true).
--   - Create all 9 documented SQL Functions.
--   - Create all 6 documented Stored Procedures.
--   - Create 0 Materialized Views (docs/api-schema.md's own "API Schema
--     Status" lists "Materialized Views: 0" -- none are currently approved;
--     the "Future Expansion" section names them as future-only).
--
-- Relationships:
--   Reads from identity, economy, discovery, protection, intelligence,
--   analytics, and governance. Writes only occur inside the 6 Stored
--   Procedures and the 4 mutating Functions (calculate_member_reputation,
--   calculate_creator_reputation, calculate_community_reputation,
--   award_badge, revoke_badge), all via SECURITY DEFINER. No table, column,
--   constraint, index, or RLS policy in any business schema (001-007) is
--   modified by this migration.
--
-- Notes on Security Philosophy (docs/api-schema.md):
--   - Every View is created with security_invoker = true, so RLS on the
--     underlying business tables is evaluated against the calling user, not
--     the view owner, exactly as documented.
--   - Read-only Functions (calculate_campaign_performance,
--     calculate_wallet_balance, is_creator_on_cooldown) use SECURITY
--     INVOKER, exactly as documented.
--   - calculate_member_reputation, calculate_creator_reputation, and
--     calculate_community_reputation recalculate and persist a stored
--     score, so despite being listed as "Functions" they are mutating
--     operations and use SECURITY DEFINER, matching the documented rule
--     that administrative/mutating operations use SECURITY DEFINER "only
--     where required."
--   - is_feature_enabled() is documented as a Function (implicitly
--     read-only) but is implemented as SECURITY DEFINER, a deliberate
--     deviation: governance.feature_flags RLS (007) is administrator-only
--     with no other role granted any access at all, so a SECURITY INVOKER
--     implementation would return false/NULL for every non-admin caller,
--     defeating the function's evident purpose (a feature flag must be
--     checkable by ordinary application code, not only administrators).
--     SECURITY DEFINER is "required" here per the documented carve-out.
--   - is_creator_on_cooldown() is kept as SECURITY INVOKER, matching the
--     literal documented category. Cooldown enforcement is centralized
--     inside distribute_campaign(), which calls it once per community
--     before creating any distribution/assignment rows (skipping, with a
--     NOTICE, any community currently under cooldown for that creator);
--     rotate_campaign() inherits this protection automatically because it
--     calls distribute_campaign() internally rather than duplicating the
--     check. When called this way, is_creator_on_cooldown() executes
--     under distribute_campaign()'s SECURITY DEFINER context, which
--     already satisfies protection.rotation_history's admin-only RLS
--     (004). A creator's own authenticated session calling the function
--     directly (outside these procedures) would still always receive
--     false, since protection.rotation_history grants no creator-facing
--     SELECT policy -- flagged in the architecture review, not silently
--     patched by loosening protection's RLS.
--   - award_badge() and revoke_badge() are mutating and use SECURITY
--     DEFINER, per the documented Administrative Functions rule.
--   - All 6 Stored Procedures use SECURITY DEFINER, per the documented rule
--     that Stored Procedures are administrative/transactional.
--   - Every SECURITY DEFINER routine includes an explicit
--     `identity.is_admin() or auth.uid() is null` guard in its body.
--     Postgres GRANT/REVOKE cannot distinguish application-level admin
--     status (every end user connects as the same `authenticated` role),
--     so authorization is enforced inside the routine, exactly mirroring
--     the pattern already used for RLS policies in 001-007.
--     `auth.uid() is null` admits trusted backend/service-role automation
--     that has no end-user JWT context, without which no scheduled or
--     backend-triggered call could ever pass the check.
--
-- Notes on documented content this migration could not implement as
-- specified, and why (business schemas are not modified to accommodate
-- these -- see Section 7 of docs/documentation-governance-framework.md,
-- flagged for architecture review rather than resolved unilaterally):
--   - api.creator_protection_view omits "Cooldown Status". Only
--     protection.community_exclusions grants creators an own-row SELECT
--     policy (004); community_cooldowns, member_cooldowns, and
--     rotation_history grant no creator-facing access at all ("No other
--     table in this schema grants any creator- or member-facing access",
--     docs/protection-schema.md). Under security_invoker = true this column
--     would be NULL for every creator, every time, not merely restricted --
--     a materially different situation from a view legitimately showing
--     less to a lower-privileged role.
--   - api.community_dashboard_view's "Active campaigns" and "Historical
--     performance" columns will read NULL for members and for any creator
--     without campaigns in that community, for the same reason:
--     economy.campaign_distributions and protection.community_performance_history
--     grant no member-facing SELECT policy. "Active campaigns" is sourced
--     from discovery.community_assignments instead of
--     economy.campaign_distributions specifically because the former at
--     least grants the owning creator access; it still grants members
--     none.
--   - api.reputation_leaderboard_view: intelligence.member_reputation and
--     creator_reputation are self-scoped (own row or admin), and
--     community_reputation is administrator-only with no self-access
--     concept at all (005). Under security_invoker = true, a non-admin
--     caller sees only their own single row (or, for the community branch,
--     nothing) -- not a comparative ranking. This view is only meaningfully
--     a "leaderboard" for administrators under the currently locked RLS.
--   - api.platform_statistics_view and api.platform_configuration_view add
--     an explicit `where identity.is_admin()` filter, which is not
--     literally written in docs/api-schema.md but is necessary for data
--     integrity: several source tables (identity.users, economy.campaigns,
--     etc.) grant "own row" SELECT to non-admins, so an unguarded
--     `count(*)` aggregate would silently return a small, wrong number for
--     a non-admin caller (their own visible rows) rather than the true
--     platform total or an empty/blocked result. platform_configuration_view
--     is additionally explicitly documented as "for administrators".
--   - api.create_performance_bonus() documents "Credits the recipient's
--     wallet", but performance_bonus_members recipients are community
--     members, and member wallets are explicitly not part of the approved
--     Economy Schema (docs/api-schema.md itself, member_dashboard_view:
--     "Member wallets are not part of the approved Economy Schema, so
--     wallet information is not exposed here"). The procedure credits the
--     recipient's economy.credit_wallets row only if one already exists
--     (i.e. the recipient is also a creator); for a pure member,
--     intelligence.performance_bonus_members is that recipient's complete
--     record of the credited bonus, with no economy-schema side effect.
--   - No formula for reputation scoring is documented anywhere in the
--     locked architecture. calculate_member_reputation,
--     calculate_creator_reputation, and calculate_community_reputation
--     implement a minimal, clearly-labeled placeholder (a simple completion
--     / engagement ratio derived only from already-existing columns) rather
--     than an invented scoring model. A real algorithm requires explicit
--     Chief Architect definition before production use.
--   - protection.community_cooldowns.created_by is NOT NULL with no
--     documented fallback for a system-initiated action, so
--     rotate_campaign() takes an explicit p_created_by parameter rather
--     than relying on identity.current_user_id() (which is NULL outside an
--     end-user session).
--   - rotate_campaign()'s cooldown length is resolved at call time from
--     governance.system_settings ('DEFAULT_COOLDOWN_DAYS'), not hardcoded,
--     per ADR-006 (settings are centrally governed). p_cooldown_days
--     remains an optional explicit override; if omitted and the setting
--     row does not yet exist (seed data is not yet implemented), the
--     procedure raises an exception rather than silently substituting an
--     invented default.
--
-- Future expansion:
--   - Materialized views (creator_statistics_mv, community_statistics_mv,
--     daily_platform_statistics_mv), per docs/analytics-schema.md, are
--     documented as reading from analytics.creator_analytics,
--     community_analytics, and platform_analytics respectively. None are
--     created here; api.creator_dashboard_view, community_dashboard_view,
--     and platform_statistics_view compute live instead.
--   - Search Functions, Recommendation Views, Analytics Views, Webhook
--     Procedures, and Maintenance Procedures (docs/api-schema.md "Future
--     Expansion") are not implemented here.
--
-- Source of truth: docs/api-schema.md
-- =============================================================================

-- =============================================================================
-- SCHEMA
-- =============================================================================

create schema if not exists api;

comment on schema api is
  'Secure, reusable database interface layer over the PCGH business schemas. Owns no business data: exposes Views, SQL Functions, and Stored Procedures only. Every application should consume this layer instead of querying business tables directly.';

-- =============================================================================
-- VIEWS
-- =============================================================================

-- ---- api.creator_dashboard_view -------------------------------------------

create or replace view api.creator_dashboard_view
with (security_invoker = true) as
select
  u.id as user_id,
  u.user_code,
  u.username,
  u.full_name,
  u.avatar_url,
  u.status,
  w.balance as wallet_balance,
  w.bonus_balance as wallet_bonus_balance,
  w.lifetime_purchased as wallet_lifetime_purchased,
  w.lifetime_spent as wallet_lifetime_spent,
  cr.campaign_score,
  cr.quality_score,
  cr.consistency_score,
  cr.trust_score,
  coalesce(ca.communities_reached, 0) as communities_reached,
  coalesce(ca.members_reached, 0) as members_reached,
  coalesce(ca.views_generated, 0) as views_generated,
  coalesce(ca.shares_generated, 0) as shares_generated,
  coalesce(ca.saves_generated, 0) as saves_generated,
  coalesce(ca.amplification_score, 0) as amplification_score,
  (
    select count(*) from economy.campaigns c
    where c.creator_id = u.id and c.status = 'active'
  ) as active_campaigns_count,
  (
    select coalesce(json_agg(b.badge_name), '[]'::json)
    from intelligence.user_badges ub
    join intelligence.badges b on b.id = ub.badge_id
    where ub.user_id = u.id
  ) as earned_badges
from identity.users u
left join economy.credit_wallets w on w.user_id = u.id
left join intelligence.creator_reputation cr on cr.user_id = u.id
left join analytics.creator_analytics ca on ca.creator_id = u.id;

comment on view api.creator_dashboard_view is
  'Creator profile, wallet summary, reputation, active campaigns, discovery/performance statistics, and earned badges.';

-- ---- api.creator_protection_view -------------------------------------------
-- Community, Exclusion Status, Reason, Expiration only. "Cooldown Status" is
-- not implemented -- see the migration header Notes.

create or replace view api.creator_protection_view
with (security_invoker = true) as
select
  ce.id as exclusion_id,
  ce.creator_id,
  ce.community_id,
  mc.name as community_name,
  mc.community_code,
  case when ce.expires_at is null or ce.expires_at > now() then true else false end as is_excluded,
  ce.reason,
  ce.expires_at
from protection.community_exclusions ce
left join identity.member_communities mc on mc.id = ce.community_id;

comment on view api.creator_protection_view is
  'A creator''s own community exclusion status (community, exclusion status, reason, expiration). Does not expose rotation/cooldown logic.';

-- ---- api.member_dashboard_view -------------------------------------------

create or replace view api.member_dashboard_view
with (security_invoker = true) as
select
  u.id as user_id,
  u.user_code,
  u.username,
  u.full_name,
  u.avatar_url,
  u.status,
  mr.reputation_score,
  mr.participation_score,
  mr.consistency_score,
  mr.trust_score,
  (
    select count(*) from discovery.member_assignments ma
    where ma.user_id = u.id and ma.status not in ('completed', 'expired', 'ignored')
  ) as pending_assignments_count,
  (
    select count(*) from discovery.member_assignments ma
    where ma.user_id = u.id and ma.status = 'completed'
  ) as completed_assignments_count,
  (
    select coalesce(sum(pbm.credit_amount), 0)
    from intelligence.performance_bonus_members pbm
    where pbm.user_id = u.id
  ) as performance_bonus_credits,
  (
    select coalesce(json_agg(b.badge_name), '[]'::json)
    from intelligence.user_badges ub
    join intelligence.badges b on b.id = ub.badge_id
    where ub.user_id = u.id
  ) as earned_badges
from identity.users u
left join intelligence.member_reputation mr on mr.user_id = u.id;

comment on view api.member_dashboard_view is
  'Member profile, reputation, pending/completed assignments, performance bonuses, and earned badges. Member wallets are not part of the approved Economy Schema and are not exposed here.';

-- ---- api.community_dashboard_view -------------------------------------------
-- "Active campaigns" and "Historical performance" read NULL for members and
-- non-owning creators -- see the migration header Notes.

create or replace view api.community_dashboard_view
with (security_invoker = true) as
select
  mc.id as community_id,
  mc.community_code,
  mc.name,
  mc.status,
  mc.member_count,
  cor.reputation_score,
  cor.activity_score,
  cor.consistency_score,
  cor.trust_score,
  (
    select count(distinct do_.campaign_id)
    from discovery.discovery_opportunities do_
    join discovery.community_assignments dca on dca.opportunity_id = do_.id
    where dca.community_id = mc.id
      and do_.status = 'active'
  ) as active_campaigns_count,
  coalesce(ca.participation_rate, 0.00) as participation_rate,
  coalesce(ca.discoveries_viewed, 0) as discoveries_viewed,
  coalesce(ca.discoveries_shared, 0) as discoveries_shared,
  coalesce(ca.discoveries_saved, 0) as discoveries_saved,
  (
    select json_agg(
      json_build_object(
        'campaign_id', cph.campaign_id,
        'engagement_rate', cph.engagement_rate,
        'performance_score', cph.performance_score,
        'recorded_at', cph.recorded_at
      ) order by cph.recorded_at desc
    )
    from protection.community_performance_history cph
    where cph.community_id = mc.id
  ) as historical_performance
from identity.member_communities mc
left join intelligence.community_reputation cor on cor.community_id = mc.id
left join analytics.community_analytics ca on ca.community_id = mc.id;

comment on view api.community_dashboard_view is
  'Community profile, reputation, members, active campaigns, engagement statistics, and historical performance.';

-- ---- api.campaign_summary_view -------------------------------------------

create or replace view api.campaign_summary_view
with (security_invoker = true) as
select
  c.id as campaign_id,
  c.campaign_code,
  c.title,
  c.campaign_type,
  c.status as campaign_status,
  c.credits_budget,
  c.credits_spent,
  c.duration_hours,
  c.created_at,
  u.id as creator_id,
  u.username as creator_username,
  u.full_name as creator_full_name,
  (
    select count(distinct dca.community_id)
    from discovery.discovery_opportunities do_
    join discovery.community_assignments dca on dca.opportunity_id = do_.id
    where do_.campaign_id = c.id
  ) as communities_reached,
  (
    select round(avg(dca.performance_score), 2)
    from discovery.discovery_opportunities do_
    join discovery.community_assignments dca on dca.opportunity_id = do_.id
    where do_.campaign_id = c.id
  ) as avg_performance_score,
  (
    select coalesce(sum(dca.members_viewed), 0)
    from discovery.discovery_opportunities do_
    join discovery.community_assignments dca on dca.opportunity_id = do_.id
    where do_.campaign_id = c.id
  ) as total_members_viewed,
  (
    select coalesce(sum(dca.members_shared), 0)
    from discovery.discovery_opportunities do_
    join discovery.community_assignments dca on dca.opportunity_id = do_.id
    where do_.campaign_id = c.id
  ) as total_members_shared,
  (
    select coalesce(sum(dca.members_saved), 0)
    from discovery.discovery_opportunities do_
    join discovery.community_assignments dca on dca.opportunity_id = do_.id
    where do_.campaign_id = c.id
  ) as total_members_saved
from economy.campaigns c
join identity.users u on u.id = c.creator_id;

comment on view api.campaign_summary_view is
  'Campaign, creator, budget, credits spent, communities reached, status, and performance metrics.';

-- ---- api.discovery_summary_view -------------------------------------------
-- member_assignments_count is derived from discovery.community_assignments
-- .members_assigned (not discovery.member_assignments row counts):
-- discovery.member_assignments RLS grants access only to the assigned
-- member or an admin, never the opportunity's creator (003), so a raw
-- count(*) against it would always read 0 for a creator. There is no
-- creator-visible authoritative source for a "completed" count at the
-- individual member level, so completed_member_assignments_count is
-- omitted rather than populated with a wrong value.

create or replace view api.discovery_summary_view
with (security_invoker = true) as
select
  do_.id as opportunity_id,
  do_.opportunity_code,
  do_.campaign_id,
  do_.creator_id,
  do_.title,
  do_.status as opportunity_status,
  do_.starts_at,
  do_.expires_at,
  (
    select count(*) from discovery.community_assignments dca where dca.opportunity_id = do_.id
  ) as community_assignments_count,
  (
    select coalesce(sum(dca.members_assigned), 0) from discovery.community_assignments dca where dca.opportunity_id = do_.id
  ) as member_assignments_count,
  (
    select coalesce(sum(dca.members_assigned), 0) from discovery.community_assignments dca where dca.opportunity_id = do_.id
  ) as total_members_assigned,
  (
    select coalesce(sum(dca.members_viewed), 0) from discovery.community_assignments dca where dca.opportunity_id = do_.id
  ) as total_members_viewed,
  (
    select coalesce(sum(dca.members_shared), 0) from discovery.community_assignments dca where dca.opportunity_id = do_.id
  ) as total_members_shared,
  (
    select coalesce(sum(dca.members_saved), 0) from discovery.community_assignments dca where dca.opportunity_id = do_.id
  ) as total_members_saved
from discovery.discovery_opportunities do_;

comment on view api.discovery_summary_view is
  'Discovery opportunities, community assignments, member assignments, completion statistics, and distribution analytics.';

-- ---- api.wallet_summary_view -------------------------------------------
-- "Pending bonuses" is not implemented as a distinct field: intelligence's
-- performance bonus records have no pending/approved lifecycle ("a bonus is
-- created already approved", docs/api-schema.md create_performance_bonus()).
-- total_bonus_credits_received is the closest real equivalent.

create or replace view api.wallet_summary_view
with (security_invoker = true) as
select
  w.id as wallet_id,
  w.user_id,
  w.balance as current_balance,
  w.lifetime_purchased as lifetime_earned,
  w.lifetime_spent,
  (w.balance + w.bonus_balance) as available_credits,
  (
    select coalesce(sum(pbm.credit_amount), 0)
    from intelligence.performance_bonus_members pbm
    where pbm.user_id = w.user_id
  ) as total_bonus_credits_received
from economy.credit_wallets w;

comment on view api.wallet_summary_view is
  'Current balance, lifetime earned, lifetime spent, available credits, and total bonus credits received.';

-- ---- api.reputation_leaderboard_view -------------------------------------------
-- Meaningfully a comparative leaderboard only for administrators under the
-- currently locked RLS -- see the migration header Notes.

create or replace view api.reputation_leaderboard_view
with (security_invoker = true) as
select
  'creator'::varchar(20) as entity_type,
  cr.user_id as entity_id,
  u.username as entity_label,
  cr.trust_score as reputation_score,
  (
    select count(*) from intelligence.user_badges ub where ub.user_id = cr.user_id
  ) as badge_total,
  rank() over (order by cr.trust_score desc) as rank
from intelligence.creator_reputation cr
join identity.users u on u.id = cr.user_id

union all

select
  'member'::varchar(20) as entity_type,
  mr.user_id as entity_id,
  u.username as entity_label,
  mr.reputation_score,
  (
    select count(*) from intelligence.user_badges ub where ub.user_id = mr.user_id
  ) as badge_total,
  rank() over (order by mr.reputation_score desc) as rank
from intelligence.member_reputation mr
join identity.users u on u.id = mr.user_id

union all

select
  'community'::varchar(20) as entity_type,
  cor.community_id as entity_id,
  mc.name as entity_label,
  cor.reputation_score,
  null::bigint as badge_total,
  rank() over (order by cor.reputation_score desc) as rank
from intelligence.community_reputation cor
join identity.member_communities mc on mc.id = cor.community_id;

comment on view api.reputation_leaderboard_view is
  'Creator, member, and community reputation rankings with badge totals.';

-- ---- api.badges_view -------------------------------------------

create or replace view api.badges_view
with (security_invoker = true) as
select
  b.id as badge_id,
  b.badge_name,
  b.description,
  b.icon_url,
  b.category,
  b.criteria,
  b.created_at,
  b.updated_at
from intelligence.badges b;

comment on view api.badges_view is
  'The badge catalog, exposed through the API layer so applications do not need to query intelligence.badges directly.';

-- ---- api.platform_statistics_view -------------------------------------------
-- Guarded to administrators only -- see the migration header Notes.

create or replace view api.platform_statistics_view
with (security_invoker = true) as
select
  (select count(*) from identity.users) as total_users,
  (select count(*) from identity.user_roles where role_name = 'creator') as total_creators,
  (select count(*) from identity.member_communities) as total_communities,
  (select count(*) from economy.campaigns) as total_campaigns,
  (select count(*) from economy.campaigns where status = 'active') as active_campaigns,
  (select coalesce(sum(lifetime_purchased), 0) from economy.credit_wallets) as total_credits_purchased,
  (select coalesce(sum(lifetime_spent), 0) from economy.credit_wallets) as total_credits_spent,
  (select count(*) from discovery.discovery_opportunities) as total_discovery_opportunities,
  (select count(*) from discovery.member_assignments) as total_member_assignments,
  (select count(*) from discovery.member_assignments where status = 'completed') as total_completed_assignments,
  (select round(avg(reputation_score), 2) from intelligence.member_reputation) as avg_member_reputation,
  (select round(avg(trust_score), 2) from intelligence.creator_reputation) as avg_creator_trust_score
where identity.is_admin();

comment on view api.platform_statistics_view is
  'Platform totals: campaign, community, credit, reputation, and discovery statistics. Administrators only.';

-- ---- api.platform_configuration_view -------------------------------------------
-- Explicitly documented as "for administrators".

create or replace view api.platform_configuration_view
with (security_invoker = true) as
select
  (
    select coalesce(json_agg(json_build_object(
      'flag_name', flag_name, 'enabled', enabled, 'description', description
    )), '[]'::json)
    from governance.feature_flags
  ) as feature_flags,
  (
    select coalesce(json_agg(json_build_object(
      'setting_name', setting_name, 'setting_value', setting_value, 'description', description
    )), '[]'::json)
    from governance.system_settings
  ) as system_settings,
  (
    select coalesce(json_agg(json_build_object(
      'rule_code', rule_code, 'rule_name', rule_name, 'is_active', is_active
    )), '[]'::json)
    from governance.governance_rules
  ) as governance_rules,
  (
    select coalesce(json_agg(json_build_object(
      'ai_feature', ai_feature, 'enabled', enabled
    )), '[]'::json)
    from governance.ai_controls
  ) as ai_controls
where identity.is_admin();

comment on view api.platform_configuration_view is
  'Platform configuration for administrators: feature flags, system settings, governance rules, and AI controls.';

-- =============================================================================
-- SQL FUNCTIONS
-- =============================================================================

-- ---- api.calculate_member_reputation(uuid) -------------------------------------------
-- SECURITY DEFINER: recalculates and persists a stored score (mutating).
-- Placeholder formula -- see migration header Notes.

create or replace function api.calculate_member_reputation(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_total_assignments  integer;
  v_completed          integer;
  v_score              decimal(10,2);
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may recalculate member reputation';
  end if;

  select count(*), count(*) filter (where status = 'completed')
    into v_total_assignments, v_completed
    from discovery.member_assignments
   where user_id = p_user_id;

  v_score := case
    when v_total_assignments > 0 then round((v_completed::decimal / v_total_assignments) * 100, 2)
    else 0.00
  end;

  insert into intelligence.member_reputation (
    user_id, reputation_score, participation_score, consistency_score, trust_score, last_updated, created_at
  ) values (
    p_user_id, v_score, v_score, v_score, v_score, now(), now()
  )
  on conflict (user_id) do update set
    reputation_score = excluded.reputation_score,
    participation_score = excluded.participation_score,
    consistency_score = excluded.consistency_score,
    trust_score = excluded.trust_score,
    last_updated = now();
end;
$$;

comment on function api.calculate_member_reputation(uuid) is
  'Recalculates and persists a member''s reputation score. Placeholder completion-ratio formula pending Chief Architect definition.';

-- ---- api.calculate_creator_reputation(uuid) -------------------------------------------

create or replace function api.calculate_creator_reputation(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_total_campaigns  integer;
  v_completed        integer;
  v_score            decimal(10,2);
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may recalculate creator reputation';
  end if;

  select count(*), count(*) filter (where status in ('completed', 'archived'))
    into v_total_campaigns, v_completed
    from economy.campaigns
   where creator_id = p_user_id;

  v_score := case
    when v_total_campaigns > 0 then round((v_completed::decimal / v_total_campaigns) * 100, 2)
    else 0.00
  end;

  insert into intelligence.creator_reputation (
    user_id, campaign_score, quality_score, consistency_score, trust_score, last_updated, created_at
  ) values (
    p_user_id, v_score, v_score, v_score, v_score, now(), now()
  )
  on conflict (user_id) do update set
    campaign_score = excluded.campaign_score,
    quality_score = excluded.quality_score,
    consistency_score = excluded.consistency_score,
    trust_score = excluded.trust_score,
    last_updated = now();
end;
$$;

comment on function api.calculate_creator_reputation(uuid) is
  'Recalculates and persists a creator''s reputation score. Placeholder completion-ratio formula pending Chief Architect definition.';

-- ---- api.calculate_community_reputation(uuid) -------------------------------------------

create or replace function api.calculate_community_reputation(p_community_id uuid)
returns void
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_total_assigned  bigint;
  v_total_engaged   bigint;
  v_score           decimal(10,2);
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may recalculate community reputation';
  end if;

  select coalesce(sum(members_assigned), 0), coalesce(sum(members_viewed), 0)
    into v_total_assigned, v_total_engaged
    from discovery.community_assignments
   where community_id = p_community_id;

  v_score := case
    when v_total_assigned > 0 then round((v_total_engaged::decimal / v_total_assigned) * 100, 2)
    else 0.00
  end;

  insert into intelligence.community_reputation (
    community_id, reputation_score, activity_score, consistency_score, trust_score, last_updated, created_at
  ) values (
    p_community_id, v_score, v_score, v_score, v_score, now(), now()
  )
  on conflict (community_id) do update set
    reputation_score = excluded.reputation_score,
    activity_score = excluded.activity_score,
    consistency_score = excluded.consistency_score,
    trust_score = excluded.trust_score,
    last_updated = now();
end;
$$;

comment on function api.calculate_community_reputation(uuid) is
  'Recalculates and persists a community''s reputation score. Placeholder engagement-ratio formula pending Chief Architect definition.';

-- ---- api.calculate_campaign_performance(uuid) -------------------------------------------
-- SECURITY INVOKER: read-only, no persisted target column exists to write to.

create or replace function api.calculate_campaign_performance(p_campaign_id uuid)
returns table (
  members_assigned bigint,
  members_viewed bigint,
  members_shared bigint,
  members_saved bigint,
  avg_performance_score numeric
)
language sql
stable
security invoker
set search_path = api, pg_temp
as $$
  select
    coalesce(sum(dca.members_assigned), 0),
    coalesce(sum(dca.members_viewed), 0),
    coalesce(sum(dca.members_shared), 0),
    coalesce(sum(dca.members_saved), 0),
    round(avg(dca.performance_score), 2)
  from discovery.discovery_opportunities do_
  join discovery.community_assignments dca on dca.opportunity_id = do_.id
  where do_.campaign_id = p_campaign_id;
$$;

comment on function api.calculate_campaign_performance(uuid) is
  'Computes campaign performance metrics live from discovery.community_assignments.';

-- ---- api.calculate_wallet_balance(uuid) -------------------------------------------

create or replace function api.calculate_wallet_balance(p_user_id uuid)
returns integer
language sql
stable
security invoker
set search_path = api, pg_temp
as $$
  select balance from economy.credit_wallets where user_id = p_user_id;
$$;

comment on function api.calculate_wallet_balance(uuid) is
  'Returns a user''s current wallet balance.';

-- ---- api.is_creator_on_cooldown(uuid, uuid) -------------------------------------------
-- SECURITY INVOKER per the documented category -- see the migration header
-- Notes on its practical callers.

create or replace function api.is_creator_on_cooldown(p_creator_id uuid, p_community_id uuid default null)
returns boolean
language sql
stable
security invoker
set search_path = api, pg_temp
as $$
  select exists (
    select 1
    from protection.rotation_history
    where creator_id = p_creator_id
      and (p_community_id is null or community_id = p_community_id)
      and cooldown_until is not null
      and cooldown_until > now()
  );
$$;

comment on function api.is_creator_on_cooldown(uuid, uuid) is
  'Returns TRUE when a creator is under an active distribution cooldown, optionally scoped to one community.';

-- ---- api.is_feature_enabled(varchar) -------------------------------------------
-- SECURITY DEFINER -- deliberate deviation from the documented "read-only =
-- INVOKER" default; see the migration header Notes.

create or replace function api.is_feature_enabled(p_flag_name varchar)
returns boolean
language sql
stable
security definer
set search_path = api, pg_temp
as $$
  select coalesce(
    (select enabled from governance.feature_flags where flag_name = p_flag_name),
    false
  );
$$;

comment on function api.is_feature_enabled(varchar) is
  'Returns whether a platform feature flag is currently enabled. SECURITY DEFINER because governance.feature_flags RLS is administrator-only.';

-- ---- api.award_badge(uuid, uuid, timestamptz) -------------------------------------------

create or replace function api.award_badge(p_user_id uuid, p_badge_id uuid, p_expires_at timestamptz default null)
returns uuid
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_award_id    uuid;
  v_badge_name  varchar(100);
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may award badges';
  end if;

  insert into intelligence.user_badges (user_id, badge_id, awarded_at, expires_at)
  values (p_user_id, p_badge_id, now(), p_expires_at)
  returning id into v_award_id;

  select badge_name into v_badge_name from intelligence.badges where id = p_badge_id;

  insert into intelligence.achievement_history (
    user_id, event_type, reference_id, description, created_at
  ) values (
    p_user_id, 'badge_award', v_award_id, coalesce(v_badge_name, 'Badge awarded'), now()
  );

  return v_award_id;
end;
$$;

comment on function api.award_badge(uuid, uuid, timestamptz) is
  'Awards a badge to a user and automatically creates the corresponding achievement_history record.';

-- ---- api.revoke_badge(uuid, uuid) -------------------------------------------

create or replace function api.revoke_badge(p_user_id uuid, p_badge_id uuid)
returns void
language plpgsql
security definer
set search_path = api, pg_temp
as $$
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may revoke badges';
  end if;

  delete from intelligence.user_badges
   where user_id = p_user_id and badge_id = p_badge_id;

  -- Historical achievement records remain unchanged, per docs/api-schema.md.
end;
$$;

comment on function api.revoke_badge(uuid, uuid) is
  'Removes a user''s active badge. Historical achievement records remain unchanged.';

-- =============================================================================
-- STORED PROCEDURES
-- =============================================================================

-- ---- api.distribute_campaign(uuid, uuid[]) -------------------------------------------

create or replace procedure api.distribute_campaign(p_campaign_id uuid, p_community_ids uuid[])
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_campaign          economy.campaigns%rowtype;
  v_opportunity_id    uuid;
  v_community_id      uuid;
  v_member            record;
  v_members_assigned  integer;
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may distribute campaigns';
  end if;

  select * into v_campaign from economy.campaigns where id = p_campaign_id;
  if not found then
    raise exception 'Campaign % not found', p_campaign_id;
  end if;

  select id into v_opportunity_id
    from discovery.discovery_opportunities
   where campaign_id = p_campaign_id;

  if v_opportunity_id is null then
    insert into discovery.discovery_opportunities (
      opportunity_code, campaign_id, creator_id, campaign_type, title, description,
      status, created_at, updated_at
    ) values (
      'DOP' || substr(v_campaign.campaign_code, 4), v_campaign.id, v_campaign.creator_id,
      v_campaign.campaign_type, v_campaign.title, v_campaign.description,
      'active', now(), now()
    )
    returning id into v_opportunity_id;
  end if;

  foreach v_community_id in array p_community_ids loop
    if api.is_creator_on_cooldown(v_campaign.creator_id, v_community_id) then
      raise notice 'Skipping community % for campaign %: creator % is under an active distribution cooldown',
        v_community_id, p_campaign_id, v_campaign.creator_id;
      continue;
    end if;

    select count(*) into v_members_assigned
      from identity.member_community_members
     where community_id = v_community_id;

    insert into discovery.community_assignments (
      opportunity_id, community_id, members_assigned, assigned_at, status
    ) values (
      v_opportunity_id, v_community_id, v_members_assigned, now(), 'assigned'
    );

    insert into economy.campaign_distributions (
      campaign_id, community_id, scheduled_at, distributed_at, status, created_at
    ) values (
      p_campaign_id, v_community_id, now(), now(), 'distributed', now()
    );

    insert into protection.rotation_history (
      creator_id, campaign_id, community_id, rotation_reason, distributed_at, created_at
    ) values (
      v_campaign.creator_id, p_campaign_id, v_community_id, 'campaign_distribution', now(), now()
    );

    for v_member in
      select user_id from identity.member_community_members where community_id = v_community_id
    loop
      insert into discovery.member_assignments (
        opportunity_id, community_id, user_id, assigned_at, status
      ) values (
        v_opportunity_id, v_community_id, v_member.user_id, now(), 'assigned'
      );

      insert into discovery.assignment_history (
        opportunity_id, community_id, user_id, action, created_at
      ) values (
        v_opportunity_id, v_community_id, v_member.user_id, 'received', now()
      );

      insert into analytics.analytics_events (
        event_type, user_id, entity_type, entity_id, created_at
      ) values (
        'DISCOVERY_ASSIGNED', v_member.user_id, 'discovery_opportunity', v_opportunity_id, now()
      );
    end loop;
  end loop;
end;
$$;

comment on procedure api.distribute_campaign(uuid, uuid[]) is
  'Full distribution workflow: Campaign -> Discovery Opportunity -> Community Assignment -> Member Assignment -> Distribution.';

-- ---- api.rotate_campaign(uuid, uuid, uuid, uuid, integer) -------------------------------------------
-- p_created_by is required: protection.community_cooldowns.created_by is
-- NOT NULL with no documented system-actor fallback -- see migration header
-- Notes. p_cooldown_days defaults to NULL and is resolved from
-- governance.system_settings ('DEFAULT_COOLDOWN_DAYS') when omitted -- see
-- migration header Notes. Cooldown enforcement for the destination
-- community is inherited from distribute_campaign(), not duplicated here.

create or replace procedure api.rotate_campaign(
  p_campaign_id uuid,
  p_old_community_id uuid,
  p_new_community_id uuid,
  p_created_by uuid,
  p_cooldown_days integer default null
)
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_campaign        economy.campaigns%rowtype;
  v_cooldown_days   integer;
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may rotate campaigns';
  end if;

  select * into v_campaign from economy.campaigns where id = p_campaign_id;
  if not found then
    raise exception 'Campaign % not found', p_campaign_id;
  end if;

  v_cooldown_days := coalesce(
    p_cooldown_days,
    (
      select (setting_value #>> '{}')::integer
      from governance.system_settings
      where setting_name = 'DEFAULT_COOLDOWN_DAYS'
    )
  );

  if v_cooldown_days is null then
    raise exception 'DEFAULT_COOLDOWN_DAYS is not set in governance.system_settings and no p_cooldown_days override was provided';
  end if;

  insert into protection.rotation_history (
    creator_id, campaign_id, community_id, rotation_reason, distributed_at, cooldown_until, created_at
  ) values (
    v_campaign.creator_id, p_campaign_id, p_old_community_id, 'retry_distribution',
    now(), now() + make_interval(days => v_cooldown_days), now()
  );

  insert into protection.community_cooldowns (
    creator_id, community_id, cooldown_days, starts_at, ends_at, created_by, created_at
  ) values (
    v_campaign.creator_id, p_old_community_id, v_cooldown_days, now(),
    now() + make_interval(days => v_cooldown_days), p_created_by, now()
  );

  call api.distribute_campaign(p_campaign_id, array[p_new_community_id]);
end;
$$;

comment on procedure api.rotate_campaign(uuid, uuid, uuid, uuid, integer) is
  'Performs creator rotation from one community to another and records protection history.';

-- ---- api.close_campaign(uuid) -------------------------------------------

create or replace procedure api.close_campaign(p_campaign_id uuid)
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_stats record;
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may close campaigns';
  end if;

  update economy.campaigns
     set status = 'completed'
   where id = p_campaign_id
     and status not in ('completed', 'archived');

  select * into v_stats from api.calculate_campaign_performance(p_campaign_id);

  insert into analytics.analytics_reports (
    report_name, report_type, generated_by, report_data, created_at
  ) values (
    'Campaign Performance', 'campaign_performance',
    coalesce(identity.current_user_id(), (select creator_id from economy.campaigns where id = p_campaign_id)),
    jsonb_build_object(
      'campaign_id', p_campaign_id,
      'members_assigned', v_stats.members_assigned,
      'members_viewed', v_stats.members_viewed,
      'members_shared', v_stats.members_shared,
      'members_saved', v_stats.members_saved,
      'avg_performance_score', v_stats.avg_performance_score
    ),
    now()
  );
end;
$$;

comment on procedure api.close_campaign(uuid) is
  'Completes a campaign and records its final performance statistics as a generated report.';

-- ---- api.archive_campaign(uuid) -------------------------------------------

create or replace procedure api.archive_campaign(p_campaign_id uuid)
language plpgsql
security definer
set search_path = api, pg_temp
as $$
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may archive campaigns';
  end if;

  update economy.campaigns
     set status = 'archived'
   where id = p_campaign_id;
end;
$$;

comment on procedure api.archive_campaign(uuid) is
  'Archives a campaign.';

-- ---- api.restore_campaign(uuid) -------------------------------------------

create or replace procedure api.restore_campaign(p_campaign_id uuid)
language plpgsql
security definer
set search_path = api, pg_temp
as $$
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may restore campaigns';
  end if;

  update economy.campaigns
     set status = 'completed'
   where id = p_campaign_id
     and status = 'archived';
end;
$$;

comment on procedure api.restore_campaign(uuid) is
  'Restores an archived campaign to completed status.';

-- ---- api.create_performance_bonus(uuid, uuid, integer, text, uuid, jsonb) -------------------------------------------
-- p_member_allocations shape: jsonb array of {"user_id": uuid, "credit_amount": integer}.
-- Wallet-crediting is conditional -- see the migration header Notes on
-- member wallets not being part of the approved Economy Schema.

create or replace procedure api.create_performance_bonus(
  p_community_id uuid,
  p_campaign_id uuid,
  p_bonus_amount integer,
  p_reason text,
  p_approved_by uuid,
  p_member_allocations jsonb
)
language plpgsql
security definer
set search_path = api, pg_temp
as $$
declare
  v_bonus_id    uuid;
  v_bonus_code  varchar(30);
  v_allocation  record;
  v_wallet      economy.credit_wallets%rowtype;
begin
  if not (identity.is_admin() or auth.uid() is null) then
    raise exception 'Only administrators may create performance bonuses';
  end if;

  v_bonus_code := 'BON' || to_char(now(), 'YYYYMMDDHH24MISS');

  insert into intelligence.performance_bonus (
    bonus_code, community_id, campaign_id, bonus_amount, reason, approved_by, approved_at, created_at
  ) values (
    v_bonus_code, p_community_id, p_campaign_id, p_bonus_amount, p_reason, p_approved_by, now(), now()
  )
  returning id into v_bonus_id;

  for v_allocation in
    select * from jsonb_to_recordset(p_member_allocations) as x(user_id uuid, credit_amount integer)
  loop
    insert into intelligence.performance_bonus_members (
      bonus_id, user_id, credit_amount, credited_at
    ) values (
      v_bonus_id, v_allocation.user_id, v_allocation.credit_amount, now()
    );

    select * into v_wallet from economy.credit_wallets where user_id = v_allocation.user_id;

    if found then
      insert into economy.credit_transactions (
        user_id, transaction_type, amount, balance_before, balance_after, reference, description, created_at
      ) values (
        v_allocation.user_id, 'bonus', v_allocation.credit_amount,
        v_wallet.balance, v_wallet.balance + v_allocation.credit_amount,
        v_bonus_code, coalesce(p_reason, 'Performance bonus'), now()
      );

      update economy.credit_wallets
         set balance = balance + v_allocation.credit_amount,
             bonus_balance = bonus_balance + v_allocation.credit_amount
       where user_id = v_allocation.user_id;
    end if;

    insert into intelligence.achievement_history (
      user_id, community_id, event_type, reference_id, description, created_at
    ) values (
      v_allocation.user_id, p_community_id, 'recognition_event', v_bonus_id,
      coalesce(p_reason, 'Performance bonus'), now()
    );
  end loop;
end;
$$;

comment on procedure api.create_performance_bonus(uuid, uuid, integer, text, uuid, jsonb) is
  'Complete performance bonus flow: creates the append-only bonus record, credits recipient wallets where one exists, and records achievement history.';

-- =============================================================================
-- GRANTS
--
-- The api schema owns no tables of its own, so there is no RLS to enable
-- here -- every view relies on security_invoker = true to defer entirely to
-- the RLS already enabled on the underlying business tables in 001-007.
-- Every SECURITY DEFINER routine enforces its own authorization internally
-- (see the header Notes), since Postgres GRANT/REVOKE cannot distinguish
-- application-level admin status among callers who all share the
-- `authenticated` role.
--
-- PostgreSQL grants EXECUTE on newly created functions and procedures to
-- PUBLIC by default -- unlike tables/views/schemas, which have no such
-- default. This is revoked explicitly below before granting to the two
-- intended roles, so that PUBLIC (and therefore anon, which relies on
-- PUBLIC's privileges) has no path to invoke any SECURITY DEFINER routine
-- in this schema, including via the `auth.uid() is null` branch of the
-- internal authorization checks, which is meant to admit trusted
-- service-role automation only, not unauthenticated callers.
-- =============================================================================

revoke execute on all functions in schema api from public;
revoke execute on all procedures in schema api from public;

grant usage on schema api to authenticated, service_role;
grant select on all tables in schema api to authenticated, service_role;
grant execute on all functions in schema api to authenticated, service_role;
grant execute on all procedures in schema api to authenticated, service_role;
