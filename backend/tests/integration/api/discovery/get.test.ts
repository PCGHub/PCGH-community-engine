jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/discovery/discovery-service', () => ({ getDiscoverySummary: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { getDiscoverySummary } from '../../../../app/services/discovery/discovery-service';
import { GET } from '../../../../app/api/v1/discovery/[opportunityId]/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockGetDiscoverySummary = getDiscoverySummary as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

describe('GET /api/v1/discovery/{opportunityId} (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockGetDiscoverySummary.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/discovery/o1'), {
      params: { opportunityId: 'o1' },
    });

    expect(response.status).toBe(401);
    expect(mockGetDiscoverySummary).not.toHaveBeenCalled();
  });

  it('returns 404 when the service returns null (not found or RLS-invisible)', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetDiscoverySummary.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/discovery/missing'), {
      params: { opportunityId: 'missing' },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Discovery opportunity not found' } });
  });

  it('returns 200 with the discovery summary and passes the route param through to the service', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetDiscoverySummary.mockResolvedValue({ opportunityId: 'o1', title: 'Discover this' });

    const response = await GET(new Request('http://localhost/api/v1/discovery/o1'), {
      params: { opportunityId: 'o1' },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { opportunityId: 'o1', title: 'Discover this' } });
    expect(mockGetDiscoverySummary).toHaveBeenCalledWith('test-token', 'o1');
  });
});
