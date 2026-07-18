import { apiError, apiSuccess } from '../../../app/api/_lib/response';

describe('apiSuccess', () => {
  it('wraps data in the { data } envelope with a 200 default', async () => {
    const response = apiSuccess({ id: '1' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { id: '1' } });
  });

  it('honors a custom status code', async () => {
    const response = apiSuccess({ id: '1' }, { status: 201 });

    expect(response.status).toBe(201);
  });

  it('includes pagination when provided', async () => {
    const response = apiSuccess([{ id: '1' }], { pagination: { limit: 10, offset: 0, total: 1 } });

    expect(await response.json()).toEqual({
      data: [{ id: '1' }],
      pagination: { limit: 10, offset: 0, total: 1 },
    });
  });

  it('omits pagination when not provided', async () => {
    const response = apiSuccess([{ id: '1' }]);

    expect(await response.json()).toEqual({ data: [{ id: '1' }] });
  });
});

describe('apiError', () => {
  it('wraps a code and message in the { error } envelope with the given status', async () => {
    const response = apiError('UNAUTHORIZED', 'Authentication required', 401);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  });
});
