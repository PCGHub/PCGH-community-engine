import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { getDiscoverySummary, listDiscoverySummaries } from '../../../app/services/discovery/discovery-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Discovery Service', () => {
  it('getDiscoverySummary maps a discovery_summary_view row to camelCase', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: {
            opportunity_id: 'op1',
            opportunity_code: 'DOP-1',
            campaign_id: 'c1',
            creator_id: 'u1',
            title: 'Discover this',
            opportunity_status: 'active',
            starts_at: null,
            expires_at: null,
            community_assignments_count: 2,
            member_assignments_count: 40,
            total_members_assigned: 40,
            total_members_viewed: 10,
            total_members_shared: 3,
            total_members_saved: 1,
          },
          error: null,
        },
      }),
    );

    const summary = await getDiscoverySummary('token', 'op1');

    expect(summary).toMatchObject({ opportunityCode: 'DOP-1', totalMembersViewed: 10 });
  });

  it('listDiscoverySummaries returns an empty array (RLS: creator/admin only) rather than throwing for a non-owning caller', async () => {
    mockCreateSupabaseClient.mockReturnValue(createMockSupabaseClient({ query: { data: [], error: null } }));

    const summaries = await listDiscoverySummaries('non-owner-token');

    expect(summaries).toEqual([]);
  });
});
