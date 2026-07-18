jest.mock('../../../../app/auth/middleware', () => ({ authenticate: jest.fn() }));
jest.mock('../../../../app/services/protection/protection-service', () => ({ listOwnExclusions: jest.fn() }));

import { authenticate } from '../../../../app/auth/middleware';
import { listOwnExclusions } from '../../../../app/services/protection/protection-service';
import { GET } from '../../../../app/api/v1/protection/exclusions/route';

const mockAuthenticate = authenticate as jest.Mock;
const mockListOwnExclusions = listOwnExclusions as jest.Mock;

const authContext = {
  session: { authUserId: 'auth-1', userId: 'user-1', accessToken: 'test-token' },
  roles: { roles: ['creator'], isAdmin: false },
};

function makeExclusion(id: string) {
  return {
    exclusionId: id,
    creatorId: 'creator-1',
    communityId: 'com-1',
    communityName: 'Community One',
    communityCode: 'COM-1',
    isExcluded: true,
    reason: 'policy violation',
    expiresAt: null,
  };
}

describe('GET /api/v1/protection/exclusions (integration)', () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockListOwnExclusions.mockReset();
  });

  it('returns 401 without calling the service when unauthenticated', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/v1/protection/exclusions'));

    expect(response.status).toBe(401);
    expect(mockListOwnExclusions).not.toHaveBeenCalled();
  });

  it('returns an empty list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListOwnExclusions.mockResolvedValue([]);

    const response = await GET(new Request('http://localhost/api/v1/protection/exclusions'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: [], pagination: { limit: 20, offset: 0, total: 0 } });
    expect(mockListOwnExclusions).toHaveBeenCalledWith('test-token');
  });

  it('returns the full list with pagination metadata when authenticated', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListOwnExclusions.mockResolvedValue([makeExclusion('ex1'), makeExclusion('ex2')]);

    const response = await GET(new Request('http://localhost/api/v1/protection/exclusions'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.pagination).toEqual({ limit: 20, offset: 0, total: 2 });
    for (const item of body.data as Record<string, unknown>[]) {
      expect(item).not.toHaveProperty('cooldown');
      expect(item).not.toHaveProperty('cooldownUntil');
    }
  });

  it('honors limit/offset query params to paginate the already-fetched list', async () => {
    mockAuthenticate.mockResolvedValue(authContext);
    mockListOwnExclusions.mockResolvedValue([makeExclusion('ex1'), makeExclusion('ex2'), makeExclusion('ex3')]);

    const response = await GET(new Request('http://localhost/api/v1/protection/exclusions?limit=1&offset=1'));
    const body = await response.json();

    expect(body.data).toEqual([expect.objectContaining({ exclusionId: 'ex2' })]);
    expect(body.pagination).toEqual({ limit: 1, offset: 1, total: 3 });
  });
});
