import { ConflictError, ForbiddenError, NotFoundError, handleServiceError } from '../../../app/api/_lib/errors';

const context = { requestId: 'req-1', route: '/api/v1/campaigns/c1/distribute' };

describe('handleServiceError -- typed errors', () => {
  it('maps NotFoundError to 404', async () => {
    const response = handleServiceError(new NotFoundError('Campaign not found'), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  });

  it('maps ConflictError to 409', async () => {
    const response = handleServiceError(new ConflictError('Campaign is already closed'), context);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: { code: 'CONFLICT', message: 'Campaign is already closed' } });
  });

  it('maps ForbiddenError to 403', async () => {
    const response = handleServiceError(new ForbiddenError('Not allowed'), context);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: { code: 'FORBIDDEN', message: 'Not allowed' } });
  });
});

describe('handleServiceError -- plain Error, message-pattern fallback', () => {
  it('classifies an admin-gate message ("Only administrators may ...") as 403', async () => {
    const response = handleServiceError(new Error('Only administrators may distribute campaigns'), context);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: { code: 'FORBIDDEN', message: 'Only administrators may distribute campaigns' },
    });
  });

  it('classifies a "... not found" message as 404, case-insensitively', async () => {
    const response = handleServiceError(new Error('Campaign 123 NOT FOUND'), context);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Campaign 123 NOT FOUND' } });
  });

  it('classifies an unmatched message as 500 without leaking the real message to the client', async () => {
    const response = handleServiceError(
      new Error('DEFAULT_COOLDOWN_DAYS is not set in governance.system_settings'),
      context,
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  it('maps a non-Error throw to 500', async () => {
    const response = handleServiceError('a string was thrown', { requestId: 'req-2', route: '/api/v1/health' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });
});
