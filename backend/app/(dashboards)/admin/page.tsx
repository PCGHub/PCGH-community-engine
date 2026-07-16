/**
 * Admin Dashboard, per Phase 5 Step 13's deliverable: consumes
 * api.platform_configuration_view (administrator-only) via the
 * Governance Service built in Phase 5 Step 5 -- reused unchanged, not
 * duplicated.
 */

import { EmptyState } from '../../components/EmptyState';
import { DashboardShell } from '../../components/DashboardShell';
import { getServerComponentAccessToken } from '../../config/supabase-server';
import { getPlatformConfiguration } from '../../services/governance/governance-service';

export default async function AdminDashboardPage() {
  const accessToken = await getServerComponentAccessToken();

  if (!accessToken) {
    return (
      <DashboardShell title="Admin Dashboard">
        <EmptyState message="Sign in to view platform configuration." />
      </DashboardShell>
    );
  }

  const configuration = await getPlatformConfiguration(accessToken);

  if (!configuration) {
    return (
      <DashboardShell title="Admin Dashboard">
        <EmptyState message="Platform configuration is administrator-only. Not available for this account." />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Admin Dashboard">
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">Feature Flags</h2>
          <ul className="space-y-2">
            {configuration.featureFlags.map((flag) => (
              <li key={flag.flagName} className="rounded-lg border border-gray-200 p-3 text-sm">
                <span className="font-medium">{flag.flagName}</span> —{' '}
                {flag.enabled ? 'enabled' : 'disabled'}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">System Settings</h2>
          <ul className="space-y-2">
            {configuration.systemSettings.map((setting) => (
              <li key={setting.settingName} className="rounded-lg border border-gray-200 p-3 text-sm">
                <span className="font-medium">{setting.settingName}</span>:{' '}
                {JSON.stringify(setting.settingValue)}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">Governance Rules</h2>
          <ul className="space-y-2">
            {configuration.governanceRules.map((rule) => (
              <li key={rule.ruleCode} className="rounded-lg border border-gray-200 p-3 text-sm">
                <span className="font-medium">{rule.ruleName}</span> —{' '}
                {rule.isActive ? 'active' : 'inactive'}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">AI Controls</h2>
          <ul className="space-y-2">
            {configuration.aiControls.map((control) => (
              <li key={control.aiFeature} className="rounded-lg border border-gray-200 p-3 text-sm">
                <span className="font-medium">{control.aiFeature}</span> —{' '}
                {control.enabled ? 'enabled' : 'disabled'}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
