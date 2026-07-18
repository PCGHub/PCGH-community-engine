jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ getCampaignSummary: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { getCampaignSummary } from '../../../../app/services/campaign/campaign-service';
import { GET } from '../../../../app/api/v1/campaigns/[campaignId]/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockGetCampaignSummary = getCampaignSummary as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

describe('GET /api/v1/campaigns/{campaignId} (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockGetCampaignSummary.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/campaigns/c1'), { params: { campaignId: 'c1' } });

    expect(response.status).toBe(401);
    expect(mockGetCampaignSummary).not.toHaveBeenCalled();
  });

  it('returns 404 when the service returns null (not found or RLS-invisible)', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetCampaignSummary.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/campaigns/missing'), {
      params: { campaignId: 'missing' },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  });

  it('returns 200 with the campaign summary and passes the route param through to the service', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetCampaignSummary.mockResolvedValue({ campaignId: 'c1', title: 'Launch' });

    const response = await GET(new Request('http://localhost/api/v1/campaigns/c1'), { params: { campaignId: 'c1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { campaignId: 'c1', title: 'Launch' } });
    expect(mockGetCampaignSummary).toHaveBeenCalledWith('test-token', 'c1');
  });
});
