jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ getCampaignPerformance: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { getCampaignPerformance } from '../../../../app/services/campaign/campaign-service';
import { GET } from '../../../../app/api/v1/campaigns/[campaignId]/performance/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockGetCampaignPerformance = getCampaignPerformance as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

describe('GET /api/v1/campaigns/{campaignId}/performance (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockGetCampaignPerformance.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/campaigns/c1/performance'), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(401);
    expect(mockGetCampaignPerformance).not.toHaveBeenCalled();
  });

  it('returns 404 when performance data is unavailable', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetCampaignPerformance.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/campaigns/c1/performance'), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(404);
  });

  it('returns 200 with the performance data', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetCampaignPerformance.mockResolvedValue({ membersAssigned: 10, membersViewed: 5 });

    const response = await GET(new Request('http://localhost/api/v1/campaigns/c1/performance'), {
      params: { campaignId: 'c1' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { membersAssigned: 10, membersViewed: 5 } });
  });
});
