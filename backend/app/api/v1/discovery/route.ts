/**
 * GET /api/v1/discovery -- list, per docs/api-specification.md
 * Section 2, wrapping Phase 5's listDiscoverySummaries() unchanged.
 * Thin controller: authenticate (withAuth) -> call the one domain
 * service function -> paginate and format the response. No business
 * logic, no new validation library. limit/offset are handled
 * exclusively by the already-approved parsePaginationParams()/
 * paginate() mechanism -- no new pagination validation.
 */

import { withAuth } from '../../_lib/handler';
import { paginate, parsePaginationParams } from '../../_lib/pagination';
import { apiSuccess } from '../../_lib/response';
import { listDiscoverySummaries } from '../../../services/discovery/discovery-service';

export const GET = withAuth(async (request, auth) => {
  const summaries = await listDiscoverySummaries(auth.session.accessToken);
  const pagination = parsePaginationParams(new URL(request.url));
  const { items, total } = paginate(summaries, pagination);

  return apiSuccess(items, { pagination: { ...pagination, total } });
});
