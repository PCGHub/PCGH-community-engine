/**
 * GET /api/v1/discovery/{opportunityId} -- one, per
 * docs/api-specification.md Section 2, wrapping Phase 5's
 * getDiscoverySummary() unchanged. A null result (not found, or
 * RLS-invisible to this caller -- the two are intentionally
 * conflated, per authentication-architecture.md) maps to 404,
 * per Section 7, matching campaigns/[campaignId]/route.ts exactly.
 *
 * opportunityId is passed through as an opaque path string, not
 * format-validated at the API layer -- the same convention verified
 * against campaigns/[campaignId]/route.ts and getCampaignSummary()
 * (EWP-002): no app-layer UUID check exists anywhere in the API
 * layer today, and a malformed id already resolves safely to 404 via
 * the service/database boundary (a non-matching .eq() query returns
 * no row, not an error), not a 500 or a leak. Discovery follows that
 * same established contract rather than introducing a
 * Discovery-only validation rule.
 */

import { withAuth } from '../../../_lib/handler';
import { apiError, apiSuccess } from '../../../_lib/response';
import { getDiscoverySummary } from '../../../../services/discovery/discovery-service';

export const GET = withAuth<{ opportunityId: string }>(async (_request, auth, _requestId, { params }) => {
  const summary = await getDiscoverySummary(auth.session.accessToken, params.opportunityId);

  if (!summary) {
    return apiError('NOT_FOUND', 'Discovery opportunity not found', 404);
  }

  return apiSuccess(summary);
});
