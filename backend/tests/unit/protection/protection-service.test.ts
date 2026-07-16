import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { listOwnExclusions } from '../../../app/services/protection/protection-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Protection Service', () => {
  it('maps creator_protection_view rows without ever including a cooldown field', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: [
            {
              exclusion_id: 'ex1',
              creator_id: 'u1',
              community_id: 'com1',
              community_name: 'Community One',
              community_code: 'COM-1',
              is_excluded: true,
              reason: 'policy violation',
              expires_at: null,
            },
          ],
          error: null,
        },
      }),
    );

    const exclusions = await listOwnExclusions('token');

    expect(exclusions).toHaveLength(1);
    expect(exclusions[0]).not.toHaveProperty('cooldownUntil');
    expect(Object.keys(exclusions[0]!)).not.toContain('cooldown');
  });

  it('returns an empty array rather than throwing when there are no exclusions', async () => {
    mockCreateSupabaseClient.mockReturnValue(createMockSupabaseClient({ query: { data: [], error: null } }));

    const exclusions = await listOwnExclusions('token');

    expect(exclusions).toEqual([]);
  });
});
