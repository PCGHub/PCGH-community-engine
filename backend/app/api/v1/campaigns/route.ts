/**
 * GET /api/v1/campaigns -- list, per docs/api-specification.md
 * Section 2, wrapping Phase 5's listCampaignSummaries() unchanged.
 * Thin controller: authenticate (withAuth) -> call the one domain
 * service function -> paginate and format the response. No business
 * logic, no new validation library.
 */

import { withAuth } from '../../_lib/handler';
import { paginate, parsePaginationParams } from '../../_lib/pagination';
import { apiSuccess } from '../../_lib/response';
import { listCampaignSummaries } from '../../../services/campaign/campaign-service';

export const GET = withAuth(async (request, auth) => {
  const summaries = await listCampaignSummaries(auth.session.accessToken);
  const pagination = parsePaginationParams(new URL(request.url));
  const { items, total } = paginate(summaries, pagination);

  return apiSuccess(items, { pagination: { ...pagination, total } });
});
