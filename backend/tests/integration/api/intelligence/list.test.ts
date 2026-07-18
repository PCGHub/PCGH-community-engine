jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/intelligence/intelligence-service', () => ({ listBadges: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { listBadges } from '../../../../app/services/intelligence/intelligence-service';
import { GET } from '../../../../app/api/v1/intelligence/badges/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockListBadges = listBadges as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

function makeBadge(id: string) {
  return {
    badgeId: id,
    badgeName: `Badge ${id}`,
    description: 'A badge',
    iconUrl: null,
    category: 'engagement',
    criteria: 'Complete 10 discoveries',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('GET /api/v1/intelligence/badges (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockListBadges.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/intelligence/badges'));

    expect(response.status).toBe(401);
    expect(mockListBadges).not.toHaveBeenCalled();
  });

  it('returns an empty list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListBadges.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/v1/intelligence/badges'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [], pagination: { limit: 20, offset: 0, total: 0 } });
    expect(mockListBadges).toHaveBeenCalledWith('test-token');
  });

  it('returns the full list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListBadges.mockResolvedValue([makeBadge('b1'), makeBadge('b2')]);

    const response = await GET(new Request('http://localhost/api/v1/intelligence/badges'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({ limit: 20, offset: 0, total: 2 });
  });

  it('honors limit/offset query params to paginate the already-fetched list', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListBadges.mockResolvedValue([makeBadge('b1'), makeBadge('b2'), makeBadge('b3')]);

    const response = await GET(new Request('http://localhost/api/v1/intelligence/badges?limit=1&offset=1'));
    const body = await response.json();

    expect(body.data).toEqual([expect.objectContaining({ badgeId: 'b2' })]);
    expect(body.pagination).toEqual({ limit: 1, offset: 1, total: 3 });
  });
});
