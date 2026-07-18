/**
 * POST /api/v1/campaigns/{campaignId}/rotate -- wraps Phase 5's
 * rotateCampaign() unchanged. Body: { oldCommunityId, newCommunityId,
 * cooldownDays? }.
 *
 * Security decision (new for EWP-002, since EWP-001 had no
 * authenticated domain route to make it on): `createdBy` is set from
 * `auth.session.userId` (the server-resolved identity.users.id), never
 * from a client-supplied request field. Per
 * authentication-architecture.md's Security Principles ("never trust
 * client-supplied identity... for any security-relevant decision"),
 * an identity-attribution field is populated from the authenticated
 * session, not request input -- consistent with, not a deviation
 * from, the approved specification (which did not previously have to
 * address this, since no domain route existed yet).
 */

import { withAuth } from '../../../../_lib/handler';
import { getMissingFields, isNonEmptyString, isNumber, parseJsonBody } from '../../../../_lib/validation';
import { apiError, apiSuccess } from '../../../../_lib/response';
import { rotateCampaign } from '../../../../../services/campaign/campaign-service';

export const POST = withAuth<{ campaignId: string }>(async (request, auth, _requestId, { params }) => {
  const body = await parseJsonBody(request);
  if (!body) {
    return apiError('BAD_REQUEST', 'Request body must be a JSON object', 400);
  }

  const missing = getMissingFields(body, ['oldCommunityId', 'newCommunityId']);
  if (missing.length > 0) {
    return apiError('BAD_REQUEST', `Missing required field(s): ${missing.join(', ')}`, 400);
  }

  if (!isNonEmptyString(body.oldCommunityId) || !isNonEmptyString(body.newCommunityId)) {
    return apiError('BAD_REQUEST', 'oldCommunityId and newCommunityId must be non-empty strings', 400);
  }

  if (body.cooldownDays !== undefined && !isNumber(body.cooldownDays)) {
    return apiError('BAD_REQUEST', 'cooldownDays must be a number when provided', 400);
  }

  await rotateCampaign(auth.session.accessToken, {
    campaignId: params.campaignId,
    oldCommunityId: body.oldCommunityId,
    newCommunityId: body.newCommunityId,
    createdBy: auth.session.userId,
    cooldownDays: body.cooldownDays as number | undefined,
  });

  return apiSuccess(null);
});
