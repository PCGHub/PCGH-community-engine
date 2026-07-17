import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase-server', () => ({
  createSupabaseServerComponentClient: jest.fn(),
}));

import { createSupabaseServerComponentClient } from '../../../app/config/supabase-server';
import { getOwnCreatorDashboard } from '../../../app/(dashboards)/creator/data';

const mockCreateSupabaseServerComponentClient = createSupabaseServerComponentClient as jest.Mock;

describe('Creator Dashboard page-local reader: getOwnCreatorDashboard', () => {
  it('maps the full creator_dashboard_view row to camelCase', async () => {
    const client = createMockSupabaseClient({
      query: {
        data: {
          user_id: 'user-1',
          user_code: 'U-001',
          username: 'alice',
          full_name: 'Alice A.',
          avatar_url: null,
          status: 'active',
          wallet_balance: 100,
          wallet_bonus_balance: 10,
          wallet_lifetime_purchased: 200,
          wallet_lifetime_spent: 100,
          campaign_score: 80,
          quality_score: 75,
          consistency_score: 90,
          trust_score: 85,
          communities_reached: 5,
          members_reached: 200,
          views_generated: 1000,
          shares_generated: 50,
          saves_generated: 20,
          amplification_score: 42,
          active_campaigns_count: 2,
          earned_badges: ['Top Contributor'],
        },
        error: null,
      },
    });
    mockCreateSupabaseServerComponentClient.mockReturnValue(client);

    const dashboard = await getOwnCreatorDashboard();

    expect(dashboard?.username).toBe('alice');
    expect(dashboard?.walletBalance).toBe(100);
    expect(dashboard?.earnedBadges).toEqual(['Top Contributor']);
    expect(client.schema).toHaveBeenCalledWith('api');
    expect(client.from).toHaveBeenCalledWith('creator_dashboard_view');
  });

  it('returns null rather than throwing when there is no session/no row', async () => {
    mockCreateSupabaseServerComponentClient.mockReturnValue(
      createMockSupabaseClient({ query: { data: null, error: null } }),
    );

    const dashboard = await getOwnCreatorDashboard();

    expect(dashboard).toBeNull();
  });

  it('defaults earnedBadges to an empty array rather than null when the view has none', async () => {
    const client = createMockSupabaseClient({
      query: {
        data: {
          user_id: 'user-1',
          user_code: 'U-001',
          username: 'alice',
          full_name: null,
          avatar_url: null,
          status: 'active',
          wallet_balance: 0,
          wallet_bonus_balance: 0,
          wallet_lifetime_purchased: 0,
          wallet_lifetime_spent: 0,
          campaign_score: null,
          quality_score: null,
          consistency_score: null,
          trust_score: null,
          communities_reached: 0,
          members_reached: 0,
          views_generated: 0,
          shares_generated: 0,
          saves_generated: 0,
          amplification_score: 0,
          active_campaigns_count: 0,
          earned_badges: null,
        },
        error: null,
      },
    });
    mockCreateSupabaseServerComponentClient.mockReturnValue(client);

    const dashboard = await getOwnCreatorDashboard();

    expect(dashboard?.earnedBadges).toEqual([]);
  });
});
