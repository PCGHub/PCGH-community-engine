import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { resolveSession } from '../../../app/auth/session';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('resolveSession', () => {
  it('resolves a valid session to authUserId and identity.users.id', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        authGetUser: { data: { user: { id: 'auth-user-1' } }, error: null },
        rpc: { data: 'identity-user-1', error: null },
      }),
    );

    const session = await resolveSession('valid-token');

    expect(session).toEqual({
      authUserId: 'auth-user-1',
      userId: 'identity-user-1',
      accessToken: 'valid-token',
    });
  });

  it('fails closed (returns null) when the Supabase session is invalid', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        authGetUser: { data: { user: null }, error: { message: 'invalid token' } },
      }),
    );

    const session = await resolveSession('bad-token');

    expect(session).toBeNull();
  });

  it('fails closed (returns null) when identity.current_user_id() cannot resolve a user', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        authGetUser: { data: { user: { id: 'auth-user-1' } }, error: null },
        rpc: { data: null, error: null },
      }),
    );

    const session = await resolveSession('valid-token-no-identity-row');

    expect(session).toBeNull();
  });
});
