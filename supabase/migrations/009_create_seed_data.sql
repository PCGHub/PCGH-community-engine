-- =============================================================================
-- Migration: 009_create_seed_data.sql
--
-- Purpose:
--   Seeds the five approved configuration tables that define default
--   platform behavior: the Intelligence badge catalog and the four
--   Governance configuration tables (feature flags, system settings,
--   governance rules, and AI controls). Seeds no other table.
--
-- Responsibilities:
--   - Seed intelligence.badges (8 catalog definitions).
--   - Seed governance.feature_flags (6 flags, all disabled by default).
--   - Seed governance.system_settings (5 settings).
--   - Seed governance.governance_rules (5 rules, all active).
--   - Seed governance.ai_controls (5 controls, all disabled by default).
--   - Remain fully idempotent: safe to run any number of times without
--     creating duplicates or changing the stable identifier of an
--     already-seeded row.
--
-- Relationships:
--   Depends on 001_create_identity_schema.sql (schema must exist, though
--   no seeded row here references identity.users -- see Notes),
--   005_create_intelligence_schema.sql (intelligence.badges), and
--   007_create_governance_schema.sql (all four governance tables).
--   Per docs/seed-data.md ("Relationships"): Identity -> Intelligence ->
--   Governance -> Seed Data.
--
-- Notes:
--   - Per docs/seed-data.md's own architecture and the approved rule that
--     "Seed Data may only create configuration records that define
--     platform behavior... never operational records that represent
--     platform activity," this migration seeds exactly the five tables
--     listed above and no others. It does not seed identity.user_roles
--     (per docs/seed-data.md: "documentation only, does not imply seeded
--     database rows"), intelligence.user_badges (badges are catalog
--     definitions only -- "no badges are assigned during seed"),
--     intelligence.member_reputation / creator_reputation /
--     community_reputation / performance_bonus / performance_bonus_members
--     / achievement_history (computed or activity records), or
--     governance.admin_overrides / platform_experiments (both record
--     actual administrative/experimental events, not configuration).
--   - No seeded row references identity.users(id). All five target
--     tables' user-attribution columns (system_settings.updated_by,
--     ai_controls.updated_by) are nullable and are left NULL here, since
--     Identity seeds no rows and no real administrator exists yet at
--     bootstrap time.
--   - intelligence.badges, governance.feature_flags,
--     governance.system_settings, and governance.governance_rules each
--     have a documented UNIQUE constraint on their natural key
--     (badge_name, flag_name, setting_name, rule_code respectively -- see
--     005 and 007), so each is seeded with a single multi-row INSERT
--     using ON CONFLICT ... DO NOTHING.
--   - governance.ai_controls has no UNIQUE constraint on ai_feature --
--     confirmed against 007, which documents this as a deliberate,
--     already-reviewed decision, not an oversight ("ai_controls' ai_feature
--     [is] documented WITHOUT a UNIQUE annotation, so no uniqueness
--     constraint is added"). docs/seed-data.md's own Implementation Notes
--     anticipate exactly this case ("Where UNIQUE constraints do not
--     exist, seed scripts should use existence checks before inserting
--     records"), so this table is seeded via INSERT ... SELECT ... WHERE
--     NOT EXISTS instead of ON CONFLICT.
--   - DEFAULT_COOLDOWN_DAYS is seeded as 14, which is a hard dependency
--     for api.rotate_campaign() (008_create_api_schema.sql), which looks
--     up this exact setting_name and raises an exception if it is
--     missing. 14 is within protection.community_cooldowns'
--     documented 1-31 day range (004) and matches the worked example in
--     docs/protection-schema.md ("Cooldown: 14 Days").
--   - DEFAULT_CAMPAIGN_DURATION is seeded as 72, matching the documented
--     platform example in docs/economy-schema.md ("Duration: 72 hours").
--   - DEFAULT_BONUS_AMOUNT is seeded as 100. No canonical default is
--     documented anywhere in the locked architecture (only an unrelated
--     worked example, "1000 Credits", appears once in
--     docs/intelligence-schema.md as an example bonus, not a stated
--     default). 100 is a clearly-labeled placeholder, not a derived or
--     approved figure -- it is configurable through Governance
--     (governance.system_settings) and should be treated as pending a
--     Chief Architect decision, the same way the reputation-scoring
--     placeholder in 008 is flagged.
--   - MAX_COMMUNITY_SIZE and MAX_CREATOR_CIRCLE_SIZE are seeded as 100,
--     matching the hard CHECK constraints already enforced on
--     identity.member_communities.member_count and
--     identity.creator_circles.member_count (001) -- chosen to stay
--     consistent with the database-level constraint, not independently
--     invented.
--   - All feature_flags and ai_controls rows are seeded disabled
--     (enabled = false), matching the platform-wide "AI systems remain
--     disabled by default" / "Multi-content campaigns remain disabled"
--     rules already locked in docs/implementation-rules.md and
--     docs/governance-schema.md.
--   - Badge descriptions are short, generic restatements of each
--     documented badge name. No eligibility criteria, thresholds, icon
--     URLs, or category taxonomy are seeded, since none are documented
--     anywhere -- inventing them would be business logic this migration
--     is not authorized to define.
--
-- Future expansion:
--   - Countries, Languages, Currencies, Marketplace Categories,
--     Notification Templates, Email Templates, Platform Themes, and
--     Subscription Plans (docs/seed-data.md "Future Seed Data") are not
--     seeded here.
--   - AI-generated default configurations (docs/seed-data.md "Future AI
--     Usage") remain disabled and out of scope.
--
-- Source of truth: docs/seed-data.md
-- =============================================================================

-- =============================================================================
-- INTELLIGENCE: badge catalog
-- =============================================================================

insert into intelligence.badges (badge_name, description, created_at, updated_at)
values
  ('Platform Pioneer',  'Awarded to early participants of the PCGH platform.',                       now(), now()),
  ('Verified Creator',  'Awarded to creators who have completed identity verification.',              now(), now()),
  ('Trusted Creator',   'Awarded to creators with a sustained record of trust and consistency.',      now(), now()),
  ('Community Champion','Awarded to members who consistently support their community.',               now(), now()),
  ('Top Contributor',   'Awarded to top-performing contributors on the platform.',                    now(), now()),
  ('Discovery Expert',  'Awarded to members with strong discovery engagement.',                       now(), now()),
  ('Campaign Master',   'Awarded to creators with a strong record of successful campaigns.',           now(), now()),
  ('Early Supporter',   'Awarded to early supporters of the PCGH platform.',                          now(), now())
on conflict (badge_name) do nothing;

-- =============================================================================
-- GOVERNANCE: feature flags
-- =============================================================================

insert into governance.feature_flags (flag_name, enabled, description, created_at, updated_at)
values
  ('MULTI_CONTENT_CAMPAIGN_ENABLED', false, 'Enables campaigns with more than one content asset. Locked disabled -- the approved Economy Schema is one campaign, one content asset.', now(), now()),
  ('AI_ROTATION_ENABLED',            false, 'Enables AI-assisted creator rotation. Disabled until approved.',        now(), now()),
  ('AI_ANALYTICS_ENABLED',           false, 'Enables AI-assisted analytics. Disabled until approved.',               now(), now()),
  ('AI_AUDIENCE_MATCHING_ENABLED',   false, 'Enables AI-assisted audience matching. Disabled until approved.',       now(), now()),
  ('AUTO_COOLDOWN_ENABLED',          false, 'Enables automatic cooldown assignment without administrator action. Disabled until approved.', now(), now()),
  ('AUTO_BONUS_ENABLED',             false, 'Enables automatic performance bonus distribution without administrator approval. Disabled until approved.', now(), now())
on conflict (flag_name) do nothing;

-- =============================================================================
-- GOVERNANCE: system settings
-- =============================================================================

insert into governance.system_settings (setting_name, setting_value, description, updated_at)
values
  ('MAX_COMMUNITY_SIZE',       to_jsonb(100), 'Maximum members per member community. Matches the CHECK constraint on identity.member_communities.member_count.', now()),
  ('MAX_CREATOR_CIRCLE_SIZE',  to_jsonb(100), 'Maximum creators per creator circle. Matches the CHECK constraint on identity.creator_circles.member_count.',      now()),
  ('DEFAULT_COOLDOWN_DAYS',    to_jsonb(14),  'Default cooldown period, in days, applied by api.rotate_campaign() when no explicit override is supplied.',       now()),
  ('DEFAULT_CAMPAIGN_DURATION',to_jsonb(72),  'Default campaign duration, in hours, matching the documented platform example (docs/economy-schema.md).',          now()),
  ('DEFAULT_BONUS_AMOUNT',     to_jsonb(100), 'PLACEHOLDER: no canonical default bonus amount is documented in the locked architecture. Configurable through Governance -- update this setting, not a future re-seed, once a real value is approved.', now())
on conflict (setting_name) do nothing;

-- =============================================================================
-- GOVERNANCE: governance rules
-- =============================================================================

insert into governance.governance_rules (rule_code, rule_name, description, is_active, created_at, updated_at)
values
  ('NO_SELF_EXPOSURE',        'No Self Exposure',                  'Creators may not be assigned discovery opportunities for their own content within their own communities.', true, now(), now()),
  ('MAX_COMMUNITY_SIZE_100',  'Maximum Community Size (100)',      'Member communities and creator circles are capped at 100 members.',                                       true, now(), now()),
  ('COOLDOWN_REQUIRED',       'Cooldown Required',                 'A cooldown period is required between a creator''s successive distributions to the same community.',       true, now(), now()),
  ('REPUTATION_REQUIRED',     'Reputation Required',               'Certain platform actions require a minimum reputation standing.',                                          true, now(), now()),
  ('ADMIN_APPROVAL_REQUIRED', 'Administrator Approval Required',   'Certain platform actions require explicit administrator approval before taking effect.',                  true, now(), now())
on conflict (rule_code) do nothing;

-- =============================================================================
-- GOVERNANCE: AI controls
--
-- No UNIQUE constraint exists on ai_feature (007, deliberate) -- seeded via
-- INSERT ... SELECT ... WHERE NOT EXISTS rather than ON CONFLICT.
-- =============================================================================

insert into governance.ai_controls (ai_feature, enabled, updated_at)
select v.ai_feature, false, now()
from (
  values
    ('AI_ROTATION'),
    ('AI_ANALYTICS'),
    ('AI_DISCOVERY'),
    ('AI_RECOMMENDATIONS'),
    ('AI_MODERATION')
) as v(ai_feature)
where not exists (
  select 1 from governance.ai_controls ac where ac.ai_feature = v.ai_feature
);
