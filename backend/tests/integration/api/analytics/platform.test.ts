jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/analytics/analytics-service', () => ({ getPlatformStatistics: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { getPlatformStatistics } from '../../../../app/services/analytics/analytics-service';
import { GET } from '../../../../app/api/v1/analytics/platform/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockGetPlatformStatistics = getPlatformStatistics as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

describe('GET /api/v1/analytics/platform (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockGetPlatformStatistics.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/analytics/platform'));

    expect(response.status).toBe(401);
    expect(mockGetPlatformStatistics).not.toHaveBeenCalled();
  });

  it('returns 404 without a distinguishing message when the service returns null (non-admin, not a missing-data signal)', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetPlatformStatistics.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/analytics/platform'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: { code: 'NOT_FOUND', message: 'Platform statistics not available' } });
  });

  it('returns 200 with the platform statistics for an authorized (admin) caller', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockGetPlatformStatistics.mockResolvedValue({ totalUsers: 10, totalCreators: 2 });

    const response = await GET(new Request('http://localhost/api/v1/analytics/platform'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { totalUsers: 10, totalCreators: 2 } });
    expect(mockGetPlatformStatistics).toHaveBeenCalledWith('test-token');
  });
});
