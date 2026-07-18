/**
 * GET /api/v1/analytics/communities -- list, per
 * docs/api-specification.md Section 2, wrapping Phase 5's
 * listCommunityDashboards() unchanged. Thin controller: authenticate
 * (withAuth) -> call the one domain service function -> paginate and
 * format the response. Visibility is scoped by
 * community_analytics_select_creator (migration 006) -- admin, or the
 * caller's own creator relationship to a community -- unchanged and
 * not reinterpreted here.
 */

import { withAuth } from '../../../_lib/handler';
import { paginate, parsePaginationParams } from '../../../_lib/pagination';
import { apiSuccess } from '../../../_lib/response';
import { listCommunityDashboards } from '../../../../services/analytics/analytics-service';

export const GET = withAuth(async (request, auth) => {
  const dashboards = await listCommunityDashboards(auth.session.accessToken);
  const pagination = parsePaginationParams(new URL(request.url));
  const { items, total } = paginate(dashboards, pagination);

  return apiSuccess(items, { pagination: { ...pagination, total } });
});
