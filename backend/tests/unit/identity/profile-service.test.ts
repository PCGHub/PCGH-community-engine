import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { getCreatorProfile, getMemberProfile, getUserProfile } from '../../../app/services/identity/profile-service';

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

  describe('getUserProfile (EWP-007, role-neutral read)', () => {
    it('maps a row to a camelCase UserProfile, identical in shape to getCreatorProfile/getMemberProfile', async () => {
      const client = createMockSupabaseClient({
        query: {
          data: {
            user_id: 'user-2',
            user_code: 'U-002',
            username: 'bob',
            full_name: null,
            avatar_url: 'https://example.com/avatar.png',
            status: 'active',
          },
          error: null,
        },
      });
      mockCreateSupabaseClient.mockReturnValue(client);

      const profile = await getUserProfile('token', 'user-2');

      expect(profile).toEqual({
        userId: 'user-2',
        userCode: 'U-002',
        username: 'bob',
        fullName: null,
        avatarUrl: 'https://example.com/avatar.png',
        status: 'active',
      });
    });

    it('queries creator_dashboard_view internally -- an implementation detail, not a role claim', async () => {
      const client = createMockSupabaseClient({ query: { data: null, error: null } });
      mockCreateSupabaseClient.mockReturnValue(client);

      await getUserProfile('token', 'user-3');

      expect(client.from).toHaveBeenCalledWith('creator_dashboard_view');
    });

    it('returns null rather than throwing when RLS yields no row', async () => {
      mockCreateSupabaseClient.mockReturnValue(createMockSupabaseClient({ query: { data: null, error: null } }));

      const profile = await getUserProfile('token', 'someone-elses-id');

      expect(profile).toBeNull();
    });
  });
});
