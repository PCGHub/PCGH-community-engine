/**
 * GET /api/v1/intelligence/badges -- Intelligence Badge Catalog API
 * (EWP-006). Wraps Phase 5's listBadges() unchanged, per
 * docs/api-specification.md Section 2. Thin controller: authenticate
 * (withAuth) -> call the one domain service function -> paginate and
 * format the response.
 *
 * This is deliberately the ONLY Intelligence Domain route. It reads
 * intelligence.badges (the badge catalog), which is public to any
 * authenticated user (badges_select_all: using (true), migration
 * 005) and admin-write-only -- unrelated to reputation scoring or
 * leaderboard ranking.
 *
 * Explicitly NOT exposed here, and not implied to be settled by this
 * route's existence: getReputationLeaderboard() (leaderboard
 * visibility remains pending ADR-014), awardBadge()/revokeBadge()/
 * the reputation recalculation functions/createPerformanceBonus()
 * (all mutations, several financial or admin-authorization-sensitive).
 * Reputation scoring itself remains provisional pending ADR-015.
 * None of that is decided, weakened, or implied finalized by this
 * catalog-only route.
 */

import { withAuth } from '../../../_lib/handler';
import { paginate, parsePaginationParams } from '../../../_lib/pagination';
import { apiSuccess } from '../../../_lib/response';
import { listBadges } from '../../../../services/intelligence/intelligence-service';

export const GET = withAuth(async (request, auth) => {
  const badges = await listBadges(auth.session.accessToken);
  const pagination = parsePaginationParams(new URL(request.url));
  const { items, total } = paginate(badges, pagination);

  return apiSuccess(items, { pagination: { ...pagination, total } });
});
