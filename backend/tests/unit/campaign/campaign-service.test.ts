import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { distributeCampaign, getCampaignSummary } from '../../../app/services/campaign/campaign-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Campaign Service', () => {
  it('getCampaignSummary maps a campaign_summary_view row to camelCase', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: {
            campaign_id: 'c1',
            campaign_code: 'CMP-1',
            title: 'Launch',
            campaign_type: 'standard',
            campaign_status: 'active',
            credits_budget: 100,
            credits_spent: 20,
            duration_hours: 72,
            created_at: '2026-01-01T00:00:00Z',
            creator_id: 'u1',
            creator_username: 'alice',
            creator_full_name: 'Alice A.',
            communities_reached: 3,
            avg_performance_score: 4.5,
            total_members_viewed: 100,
            total_members_shared: 10,
            total_members_saved: 5,
          },
          error: null,
        },
      }),
    );

    const summary = await getCampaignSummary('token', 'c1');

    expect(summary?.campaignCode).toBe('CMP-1');
    expect(summary?.creditsSpent).toBe(20);
  });

  it('distributeCampaign calls api.distribute_campaign() and never calls is_creator_on_cooldown itself', async () => {
    const client = createMockSupabaseClient({ rpc: { data: null, error: null } });
    mockCreateSupabaseClient.mockReturnValue(client);

    await distributeCampaign('token', 'c1', ['community-1', 'community-2']);

    expect(client.rpc).toHaveBeenCalledWith('distribute_campaign', {
      p_campaign_id: 'c1',
      p_community_ids: ['community-1', 'community-2'],
    });
    expect(client.rpc).not.toHaveBeenCalledWith('is_creator_on_cooldown', expect.anything());
  });

  it('propagates a procedure error rather than swallowing it', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({ rpc: { data: null, error: { message: 'Only administrators may distribute campaigns' } } }),
    );

    await expect(distributeCampaign('token', 'c1', ['community-1'])).rejects.toThrow(
      'Only administrators may distribute campaigns',
    );
  });
});
