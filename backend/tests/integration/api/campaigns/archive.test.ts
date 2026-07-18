jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ archiveCampaign: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { archiveCampaign } from '../../../../app/services/campaign/campaign-service';
import { POST } from '../../../../app/api/v1/campaigns/[campaignId]/archive/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockArchiveCampaign = archiveCampaign as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'admin-1', accessToken: 'test-token' },
  roles: { roles: ['admin'], isAdmin: true },
};

describe('POST /api/v1/campaigns/{campaignId}/archive (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockArchiveCampaign.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost/api/v1/campaigns/c1/archive', { method: 'POST' }), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(401);
    expect(mockArchiveCampaign).not.toHaveBeenCalled();
  });

  it('calls the service with the route campaignId and returns 200 on success', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockArchiveCampaign.mockResolvedValue(undefined);

    const response = await POST(new Request('http://localhost/api/v1/campaigns/c1/archive', { method: 'POST' }), {
      params: { campaignId: 'c1' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
    expect(mockArchiveCampaign).toHaveBeenCalledWith('test-token', 'c1');
  });

  it('maps a thrown service error to 403', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockArchiveCampaign.mockRejectedValue(new Error('Only administrators may archive campaigns'));

    const response = await POST(new Request('http://localhost/api/v1/campaigns/c1/archive', { method: 'POST' }), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(403);
  });
});
