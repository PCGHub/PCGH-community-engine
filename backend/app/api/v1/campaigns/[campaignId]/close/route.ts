/**
 * POST /api/v1/campaigns/{campaignId}/close -- wraps Phase 5's
 * closeCampaign() unchanged. No request body.
 */

import { withAuth } from '../../../../_lib/handler';
import { apiSuccess } from '../../../../_lib/response';
import { closeCampaign } from '../../../../../services/campaign/campaign-service';

export const POST = withAuth<{ campaignId: string }>(async (_request, auth, _requestId, { params }) => {
  await closeCampaign(auth.session.accessToken, params.campaignId);
  return apiSuccess(null);
});
