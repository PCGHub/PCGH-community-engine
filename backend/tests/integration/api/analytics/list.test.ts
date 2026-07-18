jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/analytics/analytics-service', () => ({ listCommunityDashboards: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { listCommunityDashboards } from '../../../../app/services/analytics/analytics-service';
import { GET } from '../../../../app/api/v1/analytics/communities/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockListCommunityDashboards = listCommunityDashboards as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

function makeDashboard(id: string) {
  return {
    communityId: id,
    communityCode: `COM-${id}`,
    name: 'Community',
    status: 'active',
    memberCount: 10,
    reputationScore: null,
    activityScore: null,
    consistencyScore: null,
    trustScore: null,
    activeCampaignsCount: 0,
    participationRate: 0,
    discoveriesViewed: 0,
    discoveriesShared: 0,
    discoveriesSaved: 0,
    historicalPerformance: null,
  };
}

describe('GET /api/v1/analytics/communities (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockListCommunityDashboards.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities'));

    expect(response.status).toBe(401);
    expect(mockListCommunityDashboards).not.toHaveBeenCalled();
  });

  it('returns an empty list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListCommunityDashboards.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [], pagination: { limit: 20, offset: 0, total: 0 } });
    expect(mockListCommunityDashboards).toHaveBeenCalledWith('test-token');
  });

  it('returns the full list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListCommunityDashboards.mockResolvedValue([makeDashboard('c1'), makeDashboard('c2')]);

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({ limit: 20, offset: 0, total: 2 });
  });

  it('honors limit/offset query params to paginate the already-fetched list', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListCommunityDashboards.mockResolvedValue([makeDashboard('c1'), makeDashboard('c2'), makeDashboard('c3')]);

    const response = await GET(new Request('http://localhost/api/v1/analytics/communities?limit=1&offset=1'));
    const body = await response.json();

    expect(body.data).toEqual([expect.objectContaining({ communityId: 'c2' })]);
    expect(body.pagination).toEqual({ limit: 1, offset: 1, total: 3 });
  });
});
