jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/identity/profile-service', () => ({ getUserProfile: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { getUserProfile } from '../../../../app/services/identity/profile-service';
import { GET } from '../../../../app/api/v1/identity/profile/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockGetUserProfile = getUserProfile as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['member'], isAdmin: false },
};

describe('GET /api/v1/identity/profile (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockGetUserProfile.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/identity/profile'));

    expect(response.status).toBe(401);
    expect(mockGetUserProfile).not.toHaveBeenCalled();
  });

  it('returns 404 when the service returns null', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetUserProfile.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/identity/profile'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Profile not found' } });
  });

  it('returns 200 with the profile, resolving identity from the session -- never a request parameter', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetUserProfile.mockResolvedValue({
      userId: 'user-1',
      userCode: 'U-001',
      username: 'alice',
      fullName: 'Alice A.',
      avatarUrl: null,
      status: 'active',
    });

    const response = await GET(new Request('http://localhost/api/v1/identity/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      data: {
        userId: 'user-1',
        userCode: 'U-001',
        username: 'alice',
        fullName: 'Alice A.',
        avatarUrl: null,
        status: 'active',
      },
    });
    expect(mockGetUserProfile).toHaveBeenCalledWith('test-token', 'user-1');
  });

  it('ignores any userId supplied on the request and always resolves the caller from the session', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetUserProfile.mockResolvedValue(null);

    await GET(new Request('http://localhost/api/v1/identity/profile?userId=someone-elses-id'));

    expect(mockGetUserProfile).toHaveBeenCalledWith('test-token', 'user-1');
    expect(mockGetUserProfile).not.toHaveBeenCalledWith('test-token', 'someone-elses-id');
  });
});
