/**
 * Public liveness endpoint. Proves the shared v1 routing structure,
 * response envelope, and observability integration work end-to-end.
 *
 * Deliberately unauthenticated -- the standard convention for a health
 * check -- so it does not exercise withAuth()/authenticate(); those
 * are proven by their own unit tests (backend/tests/unit/api/), not by
 * a live route, since there is no live Supabase project in this
 * environment to authenticate against.
 *
 * No domain-specific endpoint is implemented here or anywhere else in
 * EWP-001, per its explicit scope: shared foundation only.
 */

import { logger } from '../../../utils/logger';
import { generateRequestId } from '../../../utils/tracing';
import { apiSuccess } from '../../_lib/response';

export async function GET(): Promise<Response> {
  const requestId = generateRequestId();
  logger.info('api.request.completed', { requestId, route: '/api/v1/health', status: 200 });
  return apiSuccess({ status: 'ok' });
}
