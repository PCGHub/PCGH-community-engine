/**
 * Governance Domain Service, per Phase 5 Step 5's deliverable: wraps
 * api.is_feature_enabled() and api.platform_configuration_view. The
 * single owner of feature-flag checks in the backend -- no other
 * service maintains its own copy of feature-flag state
 * (app/domains/governance/README.md).
 *
 * Per the "API Schema First" principle, this queries the api schema
 * only. No caching anywhere here: both calls hit the database live on
 * every invocation, per Step 5's exit criterion that feature flag
 * checks must never diverge from governance.feature_flags.
 */

import { createSupabaseClient } from '../../config/supabase';
import type {
  AiControl,
  FeatureFlag,
  GovernanceRule,
  PlatformConfiguration,
  SystemSetting,
} from '../../domains/governance/configuration';

export async function isFeatureEnabled(accessToken: string, flagName: string): Promise<boolean> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client.schema('api').rpc('is_feature_enabled', { p_flag_name: flagName });

  if (error) {
    return false;
  }

  return Boolean(data);
}

interface PlatformConfigurationRow {
  feature_flags: { flag_name: string; enabled: boolean; description: string | null }[];
  system_settings: { setting_name: string; setting_value: unknown; description: string | null }[];
  governance_rules: { rule_code: string; rule_name: string; is_active: boolean }[];
  ai_controls: { ai_feature: string; enabled: boolean }[];
}

function toPlatformConfiguration(row: PlatformConfigurationRow): PlatformConfiguration {
  const featureFlags: FeatureFlag[] = row.feature_flags.map((f) => ({
    flagName: f.flag_name,
    enabled: f.enabled,
    description: f.description,
  }));

  const systemSettings: SystemSetting[] = row.system_settings.map((s) => ({
    settingName: s.setting_name,
    settingValue: s.setting_value,
    description: s.description,
  }));

  const governanceRules: GovernanceRule[] = row.governance_rules.map((r) => ({
    ruleCode: r.rule_code,
    ruleName: r.rule_name,
    isActive: r.is_active,
  }));

  const aiControls: AiControl[] = row.ai_controls.map((a) => ({
    aiFeature: a.ai_feature,
    enabled: a.enabled,
  }));

  return { featureFlags, systemSettings, governanceRules, aiControls };
}

/**
 * Returns null for non-administrators -- api.platform_configuration_view
 * filters to zero rows via `where identity.is_admin()`. This is not an
 * error case; it is the view's existing admin-gated design (Step 5 exit
 * criterion), and this service does not add a redundant admin check of
 * its own.
 */
export async function getPlatformConfiguration(accessToken: string): Promise<PlatformConfiguration | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('platform_configuration_view')
    .select('feature_flags, system_settings, governance_rules, ai_controls')
    .maybeSingle<PlatformConfigurationRow>();

  if (error || !data) {
    return null;
  }

  return toPlatformConfiguration(data);
}
