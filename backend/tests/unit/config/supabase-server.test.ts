jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => undefined) })),
}));

jest.mock('../../../app/config/env', () => ({
  getPublicEnv: jest.fn(() => ({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
  })),
}));

const mockGetSession = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: { getSession: mockGetSession },
  })),
}));

import { getServerComponentAccessToken } from '../../../app/config/supabase-server';

describe('getServerComponentAccessToken', () => {
  it('returns the access token when a session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } } });

    const token = await getServerComponentAccessToken();

    expect(token).toBe('token-123');
  });

  it('returns null rather than throwing when there is no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const token = await getServerComponentAccessToken();

    expect(token).toBeNull();
  });
});
