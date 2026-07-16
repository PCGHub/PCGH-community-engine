import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { getCreatorProfile, getMemberProfile } from '../../../app/services/identity/profile-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Identity Service: profile reads', () => {
  it('maps a creator_dashboard_view row to a camelCase UserProfile', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: {
            user_id: 'user-1',
            user_code: 'U-001',
            username: 'alice',
            full_name: 'Alice A.',
            avatar_url: null,
            status: 'active',
          },
          error: null,
        },
      }),
    );

    const profile = await getCreatorProfile('token', 'user-1');

    expect(profile).toEqual({
      userId: 'user-1',
      userCode: 'U-001',
      username: 'alice',
      fullName: 'Alice A.',
      avatarUrl: null,
      status: 'active',
    });
  });

  it('returns null rather than throwing when RLS yields no row', async () => {
    mockCreateSupabaseClient.mockReturnValue(createMockSupabaseClient({ query: { data: null, error: null } }));

    const profile = await getMemberProfile('token', 'someone-elses-id');

    expect(profile).toBeNull();
  });
});
