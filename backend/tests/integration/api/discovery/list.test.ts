jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/discovery/discovery-service', () => ({ listDiscoverySummaries: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { listDiscoverySummaries } from '../../../../app/services/discovery/discovery-service';
import { GET } from '../../../../app/api/v1/discovery/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockListDiscoverySummaries = listDiscoverySummaries as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

function makeSummary(id: string) {
  return {
    opportunityId: id,
    opportunityCode: `OPP-${id}`,
    campaignId: 'c1',
    creatorId: 'creator-1',
    title: 'Discover this',
    opportunityStatus: 'active',
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: null,
    communityAssignmentsCount: 0,
    memberAssignmentsCount: 0,
    totalMembersAssigned: 0,
    totalMembersViewed: 0,
    totalMembersShared: 0,
    totalMembersSaved: 0,
  };
}

describe('GET /api/v1/discovery (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockListDiscoverySummaries.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/discovery'));

    expect(response.status).toBe(401);
    expect(mockListDiscoverySummaries).not.toHaveBeenCalled();
  });

  it('returns an empty list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListDiscoverySummaries.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/v1/discovery'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [], pagination: { limit: 20, offset: 0, total: 0 } });
    expect(mockListDiscoverySummaries).toHaveBeenCalledWith('test-token');
  });

  it('returns the full list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListDiscoverySummaries.mockResolvedValue([makeSummary('o1'), makeSummary('o2')]);

    const response = await GET(new Request('http://localhost/api/v1/discovery'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({ limit: 20, offset: 0, total: 2 });
  });

  it('honors limit/offset query params to paginate the already-fetched list', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListDiscoverySummaries.mockResolvedValue([makeSummary('o1'), makeSummary('o2'), makeSummary('o3')]);

    const response = await GET(new Request('http://localhost/api/v1/discovery?limit=1&offset=1'));
    const body = await response.json();

    expect(body.data).toEqual([expect.objectContaining({ opportunityId: 'o2' })]);
    expect(body.pagination).toEqual({ limit: 1, offset: 1, total: 3 });
  });
});
