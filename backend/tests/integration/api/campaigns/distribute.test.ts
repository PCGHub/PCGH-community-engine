jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/campaign/campaign-service', () => ({ distributeCampaign: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { distributeCampaign } from '../../../../app/services/campaign/campaign-service';
import { POST } from '../../../../app/api/v1/campaigns/[campaignId]/distribute/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockDistributeCampaign = distributeCampaign as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'admin-1', accessToken: 'test-token' },
  roles: { roles: ['admin'], isAdmin: true },
};

function makeRequest(body?: unknown): Request {
  return new Request('http://localhost/api/v1/campaigns/c1/distribute', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('POST /api/v1/campaigns/{campaignId}/distribute (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockDistributeCampaign.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await POST(makeRequest({ communityIds: ['com-1'] }), { params: { campaignId: 'c1' } });

    expect(response.status).toBe(401);
    expect(mockDistributeCampaign).not.toHaveBeenCalled();
  });

  it('returns 400 when communityIds is missing', async () => {
    mockAuthenticate.mockResolvedValue(authContext);

    const response = await POST(makeRequest({}), { params: { campaignId: 'c1' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(mockDistributeCampaign).not.toHaveBeenCalled();
  });

  it('returns 400 when communityIds is not an array of strings', async () => {
    mockAuthenticate.mockResolvedValue(authContext);

    const response = await POST(makeRequest({ communityIds: [1, 2] }), { params: { campaignId: 'c1' } });

    expect(response.status).toBe(400);
    expect(mockDistributeCampaign).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed JSON body rather than 500', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    const request = new Request('http://localhost/api/v1/campaigns/c1/distribute', {
      method: 'POST',
      body: '{not valid json',
    });

    const response = await POST(request, { params: { campaignId: 'c1' } });

    expect(response.status).toBe(400);
  });

  it('calls the service and returns 200 with a null data payload on success', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockDistributeCampaign.mockResolvedValue(undefined);

    const response = await POST(makeRequest({ communityIds: ['com-1', 'com-2'] }), {
      params: { campaignId: 'c1' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
    expect(mockDistributeCampaign).toHaveBeenCalledWith('test-token', 'c1', ['com-1', 'com-2']);
  });

  it('maps an admin-gate service error to 403 (TD-005)', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockDistributeCampaign.mockRejectedValue(new Error('Only administrators may distribute campaigns'));

    const response = await POST(makeRequest({ communityIds: ['com-1'] }), { params: { campaignId: 'c1' } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: { code: 'FORBIDDEN', message: 'Only administrators may distribute campaigns' },
    });
  });

  it('maps a "not found" service error to 404, not 403 (TD-005 resolution)', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockDistributeCampaign.mockRejectedValue(new Error('Campaign c1 not found'));

    const response = await POST(makeRequest({ communityIds: ['com-1'] }), { params: { campaignId: 'c1' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Campaign c1 not found' } });
  });

  it('maps an unrecognized service error to 500 without leaking the internal message', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockDistributeCampaign.mockRejectedValue(new Error('connection reset by peer'));

    const response = await POST(makeRequest({ communityIds: ['com-1'] }), { params: { campaignId: 'c1' } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });
});
