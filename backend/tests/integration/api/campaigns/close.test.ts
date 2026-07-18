jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ closeCampaign: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { closeCampaign } from '../../../../app/services/campaign/campaign-service';
import { POST } from '../../../../app/api/v1/campaigns/[campaignId]/close/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockCloseCampaign = closeCampaign as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'admin-1', accessToken: 'test-token' },
  roles: { roles: ['admin'], isAdmin: true },
};

describe('POST /api/v1/campaigns/{campaignId}/close (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockCloseCampaign.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost/api/v1/campaigns/c1/close', { method: 'POST' }), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(401);
    expect(mockCloseCampaign).not.toHaveBeenCalled();
  });

  it('calls the service with the route campaignId and returns 200 on success', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockCloseCampaign.mockResolvedValue(undefined);

    const response = await POST(new Request('http://localhost/api/v1/campaigns/c1/close', { method: 'POST' }), {
      params: { campaignId: 'c1' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
    expect(mockCloseCampaign).toHaveBeenCalledWith('test-token', 'c1');
  });

  it('maps a thrown service error to 403', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockCloseCampaign.mockRejectedValue(new Error('Only administrators may close campaigns'));

    const response = await POST(new Request('http://localhost/api/v1/campaigns/c1/close', { method: 'POST' }), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(403);
  });
});
