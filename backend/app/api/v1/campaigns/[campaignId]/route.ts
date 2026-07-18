/**
 * GET /api/v1/campaigns/{campaignId} -- one, per
 * docs/api-specification.md Section 2, wrapping Phase 5's
 * getCampaignSummary() unchanged. A null result (not found, or
 * RLS-invisible to this caller -- the two are intentionally
 * conflated, per authentication-architecture.md) maps to 404,
 * per Section 7.
 */

import { withAuth } from '../../../_lib/handler';
import { apiError, apiSuccess } from '../../../_lib/response';
import { getCampaignSummary } from '../../../../services/campaign/campaign-service';

export const GET = withAuth<{ campaignId: string }>(async (_request, auth, _requestId, { params }) => {
  const summary = await getCampaignSummary(auth.session.accessToken, params.campaignId);

  if (!summary) {
    return apiError('NOT_FOUND', 'Campaign not found', 404);
  }

  return apiSuccess(summary);
});
