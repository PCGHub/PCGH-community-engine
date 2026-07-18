/**
 * GET /api/v1/protection/exclusions -- list, per
 * docs/api-specification.md Section 2, wrapping Phase 5's
 * listOwnExclusions() unchanged. Thin controller: authenticate
 * (withAuth) -> call the one domain service function -> paginate and
 * format the response. No business logic, no new validation library.
 *
 * Self-only by construction: the underlying RLS policy
 * (community_exclusions_creator_select, migration 004) has no admin
 * bypass, unlike Campaign/Discovery's `... or identity.is_admin()` --
 * this route must not reinterpret that at the application layer.
 *
 * listOwnExclusions() deliberately never returns a cooldown field
 * (ADR-013 remains open); this controller adds no field of its own,
 * so it cannot reintroduce what the service already omits.
 */

import { withAuth } from '../../../_lib/handler';
import { paginate, parsePaginationParams } from '../../../_lib/pagination';
import { apiSuccess } from '../../../_lib/response';
import { listOwnExclusions } from '../../../../services/protection/protection-service';

export const GET = withAuth(async (request, auth) => {
  const exclusions = await listOwnExclusions(auth.session.accessToken);
  const pagination = parsePaginationParams(new URL(request.url));
  const { items, total } = paginate(exclusions, pagination);

  return apiSuccess(items, { pagination: { ...pagination, total } });
});
