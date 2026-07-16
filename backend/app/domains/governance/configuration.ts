/**
 * Governance Domain Models, per docs/domain-architecture.md's Governance
 * Domain: shapes returned by api.platform_configuration_view
 * (administrator-only). No logic -- data shape only. See
 * app/services/governance/ for the Governance Domain Service.
 */

export interface FeatureFlag {
  readonly flagName: string;
  readonly enabled: boolean;
  readonly description: string | null;
}

export interface SystemSetting {
  readonly settingName: string;
  readonly settingValue: unknown;
  readonly description: string | null;
}

export interface GovernanceRule {
  readonly ruleCode: string;
  readonly ruleName: string;
  readonly isActive: boolean;
}

export interface AiControl {
  readonly aiFeature: string;
  readonly enabled: boolean;
}

export interface PlatformConfiguration {
  readonly featureFlags: readonly FeatureFlag[];
  readonly systemSettings: readonly SystemSetting[];
  readonly governanceRules: readonly GovernanceRule[];
  readonly aiControls: readonly AiControl[];
}
