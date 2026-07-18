jest.mock('../../../app/auth/middleware', () => ({
  authenticate: jest.fn(),
}));

import { authenticate } from '../../../app/auth/middleware';
import { apiSuccess } from '../../../app/api/_lib/response';
import { withAuth } from '../../../app/api/_lib/handler';

const mockAuthenticate = authenticate as jest.Mock;

function makeRequest(url = 'http://localhost/api/v1/health'): Request {
  return new Request(url, { headers: { authorization: 'Bearer test-token' } });
}

describe('withAuth', () => {
  it('returns 401 and never calls the wrapped handler when authenticate() returns null', async () => {
    mockAuthenticate.mockResolvedValue(null);
    const innerHandler = jest.fn();

    const response = await withAuth(innerHandler)(makeRequest());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    expect(innerHandler).not.toHaveBeenCalled();
  });

  it('calls the wrapped handler with the resolved auth context and requestId on success', async () => {
    const authContext = {
      session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
      roles: { roles: ['creator'], isAdmin: false },
    };
    mockAuthenticate.mockResolvedValue(authContext);
    const innerHandler = jest.fn().mockResolvedValue(apiSuccess({ ok: true }));

    const response = await withAuth(innerHandler)(makeRequest());

    expect(response.status).toBe(200);
    expect(innerHandler).toHaveBeenCalledWith(expect.any(Request), authContext, expect.any(String), { params: {} });
  });

  it('forwards dynamic route params to the wrapped handler unchanged', async () => {
    mockAuthenticate.mockResolvedValue({
      session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
      roles: { roles: ['creator'], isAdmin: false },
    });
    const innerHandler = jest.fn().mockResolvedValue(apiSuccess({ ok: true }));

    await withAuth(innerHandler)(makeRequest(), { params: { campaignId: 'c1' } });

    expect(innerHandler).toHaveBeenCalledWith(expect.any(Request), expect.anything(), expect.any(String), {
      params: { campaignId: 'c1' },
    });
  });

  it('maps a thrown service error to the centralized 403 response rather than crashing', async () => {
    mockAuthenticate.mockResolvedValue({
      session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
      roles: { roles: ['admin'], isAdmin: true },
    });
    const innerHandler = jest.fn().mockRejectedValue(new Error('Only administrators may distribute campaigns'));

    const response = await withAuth(innerHandler)(makeRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: { code: 'FORBIDDEN', message: 'Only administrators may distribute campaigns' },
    });
  });
});
