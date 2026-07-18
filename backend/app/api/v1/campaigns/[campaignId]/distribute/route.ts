/**
 * POST /api/v1/campaigns/{campaignId}/distribute -- wraps Phase 5's
 * distributeCampaign() unchanged. Body: { communityIds: string[] }.
 * Validation is inline per Section 6 -- only the primitives
 * (isStringArray, getMissingFields, parseJsonBody) are shared.
 *
 * Known limitation, not fixed here (out of EWP-002's scope --
 * "reuse the established... error-handling infrastructure," not
 * change it): api.distribute_campaign() can raise "Campaign %s not
 * found" for a genuinely missing campaign, which errors.ts's current
 * 403-only mapping (per api-specification.md Section 7) reports as
 * 403 Forbidden rather than 404 Not Found. Flagged, not silently
 * accepted -- see this EWP's compliance review.
 */

import { withAuth } from '../../../../_lib/handler';
import { getMissingFields, isStringArray, parseJsonBody } from '../../../../_lib/validation';
import { apiError, apiSuccess } from '../../../../_lib/response';
import { distributeCampaign } from '../../../../../services/campaign/campaign-service';

export const POST = withAuth<{ campaignId: string }>(async (request, auth, _requestId, { params }) => {
  const body = await parseJsonBody(request);
  if (!body) {
    return apiError('BAD_REQUEST', 'Request body must be a JSON object', 400);
  }

  const missing = getMissingFields(body, ['communityIds']);
  if (missing.length > 0) {
    return apiError('BAD_REQUEST', `Missing required field(s): ${missing.join(', ')}`, 400);
  }

  if (!isStringArray(body.communityIds)) {
    return apiError('BAD_REQUEST', 'communityIds must be an array of strings', 400);
  }

  await distributeCampaign(auth.session.accessToken, params.campaignId, body.communityIds);

  return apiSuccess(null);
});
