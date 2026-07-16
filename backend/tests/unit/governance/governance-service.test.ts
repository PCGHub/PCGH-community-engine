import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { getPlatformConfiguration, isFeatureEnabled } from '../../../app/services/governance/governance-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Governance Service', () => {
  it('isFeatureEnabled reads live from api.is_feature_enabled(), no caching', async () => {
    const client = createMockSupabaseClient({ rpc: { data: true, error: null } });
    mockCreateSupabaseClient.mockReturnValue(client);

    const enabled = await isFeatureEnabled('token', 'SOME_FLAG');

    expect(enabled).toBe(true);
    expect(client.schema).toHaveBeenCalledWith('api');
  });

  it('isFeatureEnabled defaults to false on error rather than throwing', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({ rpc: { data: null, error: { message: 'rpc failed' } } }),
    );

    const enabled = await isFeatureEnabled('token', 'SOME_FLAG');

    expect(enabled).toBe(false);
  });

  it('getPlatformConfiguration returns null for non-administrators (view yields zero rows, not an error)', async () => {
    mockCreateSupabaseClient.mockReturnValue(createMockSupabaseClient({ query: { data: null, error: null } }));

    const configuration = await getPlatformConfiguration('non-admin-token');

    expect(configuration).toBeNull();
  });

  it('getPlatformConfiguration maps every configuration category for administrators', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: {
            feature_flags: [{ flag_name: 'X', enabled: true, description: null }],
            system_settings: [{ setting_name: 'Y', setting_value: 14, description: null }],
            governance_rules: [{ rule_code: 'R1', rule_name: 'Rule 1', is_active: true }],
            ai_controls: [{ ai_feature: 'AI_X', enabled: false }],
          },
          error: null,
        },
      }),
    );

    const configuration = await getPlatformConfiguration('admin-token');

    expect(configuration).toEqual({
      featureFlags: [{ flagName: 'X', enabled: true, description: null }],
      systemSettings: [{ settingName: 'Y', settingValue: 14, description: null }],
      governanceRules: [{ ruleCode: 'R1', ruleName: 'Rule 1', isActive: true }],
      aiControls: [{ aiFeature: 'AI_X', enabled: false }],
    });
  });
});
