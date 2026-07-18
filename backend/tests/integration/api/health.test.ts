/**
 * Integration test for GET /api/v1/health, per the Founder's Phase 6
 * Testing Directive (docs/engineering-principles.md QGR-006) and
 * docs/api-specification.md's "Testing Conventions" section: exercises
 * the real route handler end-to-end and asserts on the actual Response
 * it returns, rather than testing an isolated _lib module.
 *
 * The first route built (EWP-001) predates this directive -- this test
 * applies it retroactively, not just to routes built after it.
 */

import { GET } from '../../../app/api/v1/health/route';

describe('GET /api/v1/health (integration)', () => {
  it('returns the standard success envelope with status ok, unauthenticated', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { status: 'ok' } });
  });
});
