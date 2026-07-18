/**
 * GET /api/v1/campaigns/{campaignId}/performance -- wraps Phase 5's
 * getCampaignPerformance() unchanged. An additive read endpoint not
 * in docs/api-specification.md Section 2's illustrative route list,
 * but an existing campaign capability per EWP-002's own scope
 * ("expose only existing campaign capabilities") -- a routine,
 * non-deviating addition per the Amendment Rule (same GET/404
 * convention as every other read route).
 */

import { withAuth } from '../../../../_lib/handler';
import { apiError, apiSuccess } from '../../../../_lib/response';
import { getCampaignPerformance } from '../../../../../services/campaign/campaign-service';

export const GET = withAuth<{ campaignId: string }>(async (_request, auth, _requestId, { params }) => {
  const performance = await getCampaignPerformance(auth.session.accessToken, params.campaignId);

  if (!performance) {
    return apiError('NOT_FOUND', 'Campaign performance not available', 404);
  }

  return apiSuccess(performance);
});
