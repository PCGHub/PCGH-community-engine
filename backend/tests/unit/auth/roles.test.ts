import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { resolveRoles } from '../../../app/auth/roles';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('resolveRoles', () => {
  it('returns the full multi-role set, never flattened to one role', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: { data: [{ role_name: 'member' }, { role_name: 'creator' }], error: null },
        rpc: { data: false, error: null },
      }),
    );

    const roles = await resolveRoles('token', 'user-1');

    expect(roles).toEqual({ roles: ['member', 'creator'], isAdmin: false });
  });

  it('reflects admin status from identity.is_admin(), read live', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: { data: [{ role_name: 'admin' }], error: null },
        rpc: { data: true, error: null },
      }),
    );

    const roles = await resolveRoles('token', 'admin-user');

    expect(roles.isAdmin).toBe(true);
  });

  it('throws rather than silently defaulting when role resolution errors', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: { data: null, error: { message: 'query failed' } },
        rpc: { data: false, error: null },
      }),
    );

    await expect(resolveRoles('token', 'user-1')).rejects.toThrow('Role resolution failed');
  });
});
