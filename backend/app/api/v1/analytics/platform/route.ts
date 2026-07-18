/**
 * GET /api/v1/analytics/platform -- wraps Phase 5's
 * getPlatformStatistics() unchanged, per docs/api-specification.md
 * Section 2.
 *
 * Intentional non-disclosure semantic (EWP-005): `platform_statistics_view`
 * filters to zero rows for non-administrators (`where identity.is_admin()`)
 * -- it does not reveal that the resource "does not exist"; it simply
 * reveals nothing to an unauthorized caller. The 404 returned here for a
 * `null` result is the same fail-closed, non-distinguishing response
 * used for every other RLS-invisible/not-found conflation in this API
 * (per campaigns/[campaignId]/performance/route.ts's precedent) -- it
 * must never be read as evidence that platform statistics do not exist,
 * only that this caller cannot see them. Do not add a different status
 * code or message for "admin sees nothing because there is no data" vs.
 * "non-admin is denied" -- distinguishing those would itself be a
 * disclosure.
 */

import { withAuth } from '../../../_lib/handler';
import { apiError, apiSuccess } from '../../../_lib/response';
import { getPlatformStatistics } from '../../../../services/analytics/analytics-service';

export const GET = withAuth(async (_request, auth) => {
  const statistics = await getPlatformStatistics(auth.session.accessToken);

  if (!statistics) {
    return apiError('NOT_FOUND', 'Platform statistics not available', 404);
  }

  return apiSuccess(statistics);
});
