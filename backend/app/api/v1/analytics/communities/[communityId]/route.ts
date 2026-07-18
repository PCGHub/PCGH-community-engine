/**
 * GET /api/v1/analytics/communities/{communityId} -- one, per
 * docs/api-specification.md Section 2, wrapping Phase 5's
 * getCommunityDashboard() unchanged. A null result (not found, or
 * RLS-invisible to this caller -- the two are intentionally
 * conflated, per authentication-architecture.md) maps to 404,
 * matching every other get-by-id route in this API exactly.
 *
 * communityId is passed through as an opaque path string, unchanged
 * from the established API-wide convention (no app-layer UUID
 * validation -- see campaigns/[campaignId]/route.ts and
 * discovery/[opportunityId]/route.ts).
 */

import { withAuth } from '../../../../_lib/handler';
import { apiError, apiSuccess } from '../../../../_lib/response';
import { getCommunityDashboard } from '../../../../../services/analytics/analytics-service';

export const GET = withAuth<{ communityId: string }>(async (_request, auth, _requestId, { params }) => {
  const dashboard = await getCommunityDashboard(auth.session.accessToken, params.communityId);

  if (!dashboard) {
    return apiError('NOT_FOUND', 'Community dashboard not found', 404);
  }

  return apiSuccess(dashboard);
});
