jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ listCampaignSummaries: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { listCampaignSummaries } from '../../../../app/services/campaign/campaign-service';
import { GET } from '../../../../app/api/v1/campaigns/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockListCampaignSummaries = listCampaignSummaries as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['admin'], isAdmin: true },
};

function makeSummary(id: string) {
  return {
    campaignId: id,
    campaignCode: `CMP-${id}`,
    title: 'Launch',
    campaignType: 'standard',
    campaignStatus: 'active',
    creditsBudget: 100,
    creditsSpent: 0,
    durationHours: 72,
    createdAt: '2026-01-01T00:00:00Z',
    creatorId: 'creator-1',
    creatorUsername: 'alice',
    creatorFullName: null,
    communitiesReached: 0,
    avgPerformanceScore: null,
    totalMembersViewed: 0,
    totalMembersShared: 0,
    totalMembersSaved: 0,
  };
}

describe('GET /api/v1/campaigns (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockListCampaignSummaries.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/campaigns'));

    expect(response.status).toBe(401);
    expect(mockListCampaignSummaries).not.toHaveBeenCalled();
  });

  it('returns the full list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListCampaignSummaries.mockResolvedValue([makeSummary('c1'), makeSummary('c2')]);

    const response = await GET(new Request('http://localhost/api/v1/campaigns'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({ limit: 20, offset: 0, total: 2 });
    expect(mockListCampaignSummaries).toHaveBeenCalledWith('test-token');
  });

  it('honors limit/offset query params to paginate the already-fetched list', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListCampaignSummaries.mockResolvedValue([makeSummary('c1'), makeSummary('c2'), makeSummary('c3')]);

    const response = await GET(new Request('http://localhost/api/v1/campaigns?limit=1&offset=1'));
    const body = await response.json();

    expect(body.data).toEqual([expect.objectContaining({ campaignId: 'c2' })]);
    expect(body.pagination).toEqual({ limit: 1, offset: 1, total: 3 });
  });
});
