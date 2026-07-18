/**
 * POST /api/v1/campaigns/{campaignId}/archive -- wraps Phase 5's
 * archiveCampaign() unchanged. No request body.
 */

import { withAuth } from '../../../../_lib/handler';
import { apiSuccess } from '../../../../_lib/response';
import { archiveCampaign } from '../../../../../services/campaign/campaign-service';

export const POST = withAuth<{ campaignId: string }>(async (_request, auth, _requestId, { params }) => {
  await archiveCampaign(auth.session.accessToken, params.campaignId);
  return apiSuccess(null);
});
