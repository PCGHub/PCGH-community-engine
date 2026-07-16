import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { getCommunityDashboard, getPlatformStatistics } from '../../../app/services/analytics/analytics-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Analytics Service', () => {
  it('getPlatformStatistics returns null for non-administrators rather than partial data', async () => {
    mockCreateSupabaseClient.mockReturnValue(createMockSupabaseClient({ query: { data: null, error: null } }));

    const stats = await getPlatformStatistics('non-admin-token');

    expect(stats).toBeNull();
  });

  it('getCommunityDashboard passes through a null historicalPerformance rather than fabricating one', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: {
            community_id: 'com1',
            community_code: 'COM-1',
            name: 'Community One',
            status: 'active',
            member_count: 50,
            reputation_score: 70,
            activity_score: 60,
            consistency_score: 65,
            trust_score: 80,
            active_campaigns_count: 0,
            participation_rate: 0.4,
            discoveries_viewed: 10,
            discoveries_shared: 2,
            discoveries_saved: 1,
            historical_performance: null,
          },
          error: null,
        },
      }),
    );

    const dashboard = await getCommunityDashboard('non-admin-token', 'com1');

    expect(dashboard?.historicalPerformance).toBeNull();
    expect(dashboard?.activeCampaignsCount).toBe(0);
  });
});
