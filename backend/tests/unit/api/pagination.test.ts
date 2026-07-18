import { paginate, parsePaginationParams } from '../../../app/api/_lib/pagination';

describe('parsePaginationParams', () => {
  it('defaults to limit 20, offset 0 when no params are given', () => {
    const params = parsePaginationParams(new URL('http://localhost/api/v1/campaigns'));

    expect(params).toEqual({ limit: 20, offset: 0 });
  });

  it('honors valid limit/offset query params', () => {
    const params = parsePaginationParams(new URL('http://localhost/api/v1/campaigns?limit=5&offset=10'));

    expect(params).toEqual({ limit: 5, offset: 10 });
  });

  it('clamps limit to the maximum rather than allowing an unbounded fetch', () => {
    const params = parsePaginationParams(new URL('http://localhost/api/v1/campaigns?limit=999'));

    expect(params.limit).toBe(100);
  });

  it('falls back to defaults for invalid values rather than erroring', () => {
    const params = parsePaginationParams(new URL('http://localhost/api/v1/campaigns?limit=abc&offset=-5'));

    expect(params).toEqual({ limit: 20, offset: 0 });
  });
});

describe('paginate', () => {
  it('slices the array and reports the true total', () => {
    const items = [1, 2, 3, 4, 5];

    const result = paginate(items, { limit: 2, offset: 1 });

    expect(result).toEqual({ items: [2, 3], total: 5 });
  });

  it('returns an empty slice with the correct total when offset exceeds the array length', () => {
    const items = [1, 2, 3];

    const result = paginate(items, { limit: 10, offset: 10 });

    expect(result).toEqual({ items: [], total: 3 });
  });
});
