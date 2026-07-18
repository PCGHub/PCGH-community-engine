jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/analytics/analytics-service', () => ({ getCommunityDashboard: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { getCommunityDashboard } from '../../../../app/services/analytics/analytics-service';
import { GET } from '../../../../app/api/v1/analytics/communities/[communityId]/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockGetCommunityDashboard = getCommunityDashboard as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

describe('GET /api/v1/analytics/communities/{communityId} (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockGetCommunityDashboard.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities/c1'), {
      params: { communityId: 'c1' },
    });

    expect(response.status).toBe(401);
    expect(mockGetCommunityDashboard).not.toHaveBeenCalled();
  });

  it('returns 404 when the service returns null (not found or RLS-invisible)', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetCommunityDashboard.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities/missing'), {
      params: { communityId: 'missing' },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Community dashboard not found' } });
  });

  it('returns 200 with the community dashboard and passes the route param through to the service', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetCommunityDashboard.mockResolvedValue({ communityId: 'c1', name: 'Community One' });

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities/c1'), {
      params: { communityId: 'c1' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { communityId: 'c1', name: 'Community One' } });
    expect(mockGetCommunityDashboard).toHaveBeenCalledWith('test-token', 'c1');
  });
});
