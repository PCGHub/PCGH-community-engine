/**
 * Shared controller wrapper, per docs/api-specification.md Section 8:
 * "A small, shared controller helper... anticipated to reduce
 * repetition across ~15+ route handlers... must contain zero business
 * logic and must not become a place where authorization or validation
 * decisions are silently made on the API layer's behalf."
 *
 * Composes exactly what every authenticated controller needs before
 * calling its one domain service function (Section 1, Thin Controller
 * Principle): resolve a requestId (Section 9), authenticate the
 * request (Section 4, using app/auth/middleware.ts's authenticate()
 * exactly as designed -- this is the Controller layer that decision
 * anticipated), catch any thrown service error (Section 7's mapping,
 * via errors.ts), and log the outcome. It does not validate the
 * request body (Section 6 keeps that inline per-endpoint) and does
 * not decide which service to call -- both remain the route handler's
 * job.
 *
 * EWP-002 addition: accepts and forwards Next.js's dynamic route
 * `context.params` (e.g. `{ campaignId: string }`), needed for
 * `[campaignId]/route.ts`-style routes -- EWP-001's health route had
 * no dynamic segment, so this gap wasn't exercised until the first
 * domain routes. `context` defaults to `{ params: {} }` so
 * non-dynamic routes (like health) are unaffected if they ever adopt
 * this wrapper.
 */

import type { NextResponse } from 'next/server';
import { authenticate, type AuthContext } from '../../auth/middleware';
import { logger } from '../../utils/logger';
import { generateRequestId } from '../../utils/tracing';
import { apiError } from './response';
import { handleServiceError } from './errors';

export interface RouteContext<TParams extends Record<string, string> = Record<string, string>> {
  readonly params: TParams;
}

export type AuthenticatedRouteHandler<TParams extends Record<string, string> = Record<string, string>> = (
  request: Request,
  auth: AuthContext,
  requestId: string,
  context: RouteContext<TParams>,
) => Promise<NextResponse>;

/**
 * Wraps a route handler with authentication and centralized error
 * handling. On an invalid/missing session, responds 401 without
 * calling the handler or the service it would have called (fail
 * closed, per docs/engineering-principles.md EPR-004).
 */
export function withAuth<TParams extends Record<string, string> = Record<string, string>>(
  handler: AuthenticatedRouteHandler<TParams>,
) {
  return async function wrappedHandler(
    request: Request,
    context: RouteContext<TParams> = { params: {} as TParams },
  ): Promise<NextResponse> {
    const requestId = generateRequestId();
    const route = new URL(request.url).pathname;

    const auth = await authenticate(request);
    if (!auth) {
      logger.info('api.request.unauthorized', { requestId, route });
      return apiError('UNAUTHORIZED', 'Authentication required', 401);
    }

    try {
      const response = await handler(request, auth, requestId, context);
      logger.info('api.request.completed', { requestId, route, status: response.status });
      return response;
    } catch (error) {
      return handleServiceError(error, { requestId, route });
    }
  };
}
