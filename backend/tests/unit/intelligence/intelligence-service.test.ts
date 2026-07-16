import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import {
  awardBadge,
  getReputationLeaderboard,
  listBadges,
} from '../../../app/services/intelligence/intelligence-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Intelligence Service', () => {
  it('listBadges maps the badge catalog to camelCase', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: [
            {
              badge_id: 'b1',
              badge_name: 'Top Contributor',
              description: null,
              icon_url: null,
              category: 'engagement',
              criteria: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ],
          error: null,
        },
      }),
    );

    const badges = await listBadges('token');

    expect(badges[0]?.badgeName).toBe('Top Contributor');
  });

  it('every reputation leaderboard entry is marked isProvisional (ADR-015 open)', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: [
            {
              entity_type: 'creator',
              entity_id: 'u1',
              entity_label: 'alice',
              reputation_score: 88,
              badge_total: 2,
              rank: 1,
            },
          ],
          error: null,
        },
      }),
    );

    const leaderboard = await getReputationLeaderboard('token');

    expect(leaderboard[0]?.isProvisional).toBe(true);
  });

  it('awardBadge propagates the admin-only error rather than succeeding silently', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({ rpc: { data: null, error: { message: 'Only administrators may award badges' } } }),
    );

    await expect(awardBadge('token', 'user-1', 'badge-1')).rejects.toThrow('Only administrators may award badges');
  });
});
