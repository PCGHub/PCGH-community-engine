/**
 * GET /api/v1/identity/profile -- Identity Profile API (EWP-007).
 * Wraps Phase 5's getUserProfile() (added Phase 6, EWP-007) unchanged,
 * per docs/api-specification.md Section 2.
 *
 * Self-only by construction: identity is always resolved from
 * auth.session.userId, never from a request parameter -- there is no
 * [userId] route, and none is intended. This is the same
 * session-derived-identity principle already established for
 * mutation-attribution fields (rotateCampaign's createdBy),
 * extended here to a read for the first time, because
 * identity.users' RLS (users_select_own: self-or-admin, migration
 * 001) has no broader visibility to rely on and no public-profile
 * capability is approved anywhere in this architecture.
 *
 * Calls getUserProfile(), not getCreatorProfile() or
 * getMemberProfile() -- neither of those names is an accurate
 * description of an arbitrary authenticated caller (a member-only
 * user is not a creator, and vice versa; see profile-service.ts's
 * own comment on getUserProfile() for the full reasoning). A null
 * result maps to 404 -- a legitimate defensive outcome, not a
 * theoretically-unreachable case; nothing in the authentication
 * architecture guarantees a resolved session always has a matching
 * identity.users row.
 */

import { withAuth } from '../../../_lib/handler';
import { apiError, apiSuccess } from '../../../_lib/response';
import { getUserProfile } from '../../../../services/identity/profile-service';

export const GET = withAuth(async (_request, auth) => {
  const profile = await getUserProfile(auth.session.accessToken, auth.session.userId);

  if (!profile) {
    return apiError('NOT_FOUND', 'Profile not found', 404);
  }

  return apiSuccess(profile);
});
