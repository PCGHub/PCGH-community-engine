jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ rotateCampaign: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { rotateCampaign } from '../../../../app/services/campaign/campaign-service';
import { POST } from '../../../../app/api/v1/campaigns/[campaignId]/rotate/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockRotateCampaign = rotateCampaign as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'admin-1', accessToken: 'test-token' },
  roles: { roles: ['admin'], isAdmin: true },
};

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/campaigns/c1/rotate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/v1/campaigns/{campaignId}/rotate (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockRotateCampaign.mockReset();
  });

  it('returns 400 when required fields are missing', async () => {
    mockAuthenticate.mockResolvedValue(authContext);

    const response = await POST(makeRequest({ oldCommunityId: 'com-1' }), { params: { campaignId: 'c1' } });

    expect(response.status).toBe(400);
    expect(mockRotateCampaign).not.toHaveBeenCalled();
  });

  it('returns 400 when cooldownDays is provided but not a number', async () => {
    mockAuthenticate.mockResolvedValue(authContext);

    const response = await POST(
      makeRequest({ oldCommunityId: 'com-1', newCommunityId: 'com-2', cooldownDays: 'soon' }),
      { params: { campaignId: 'c1' } },
    );

    expect(response.status).toBe(400);
    expect(mockRotateCampaign).not.toHaveBeenCalled();
  });

  it('derives createdBy from the authenticated session, ignoring any client-supplied value', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockRotateCampaign.mockResolvedValue(undefined);

    const response = await POST(
      makeRequest({
        oldCommunityId: 'com-1',
        newCommunityId: 'com-2',
        createdBy: 'attacker-supplied-id',
      }),
      { params: { campaignId: 'c1' } },
    );

    expect(response.status).toBe(200);
    expect(mockRotateCampaign).toHaveBeenCalledWith('test-token', {
      campaignId: 'c1',
      oldCommunityId: 'com-1',
      newCommunityId: 'com-2',
      createdBy: 'admin-1',
      cooldownDays: undefined,
    });
  });

  it('maps a thrown service error to 403', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockRotateCampaign.mockRejectedValue(new Error('Only administrators may rotate campaigns'));

    const response = await POST(makeRequest({ oldCommunityId: 'com-1', newCommunityId: 'com-2' }), {
      params: { campaignId: 'c1' },
    });

    expect(response.status).toBe(403);
  });
});
