/**
 * Discovery Domain Service, per Phase 5 Step 7's deliverable: wraps
 * api.discovery_summary_view. Per the "API Schema First" principle,
 * this queries the api schema only -- never discovery.* directly.
 *
 * Discovery Domain reads and reports; it does not initiate
 * distribution (app/domains/discovery/README.md) -- distribution is
 * Campaign Domain's api.distribute_campaign(), not duplicated here.
 *
 * api.discovery_summary_view is `security_invoker = true` over
 * discovery.discovery_opportunities, whose RLS policy
 * (discovery_opportunities_select_own, migration 003) already scopes
 * rows to `creator_id = identity.current_user_id() or
 * identity.is_admin()`. This service adds no broader visibility of its
 * own -- per Step 7's exit criteria, it must not attempt to expose
 * discovery data more broadly at the application layer.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { DiscoverySummary } from '../../domains/discovery/discovery';

interface DiscoverySummaryRow {
  opportunity_id: string;
  opportunity_code: string;
  campaign_id: string;
  creator_id: string;
  title: string;
  opportunity_status: string;
  starts_at: string | null;
  expires_at: string | null;
  community_assignments_count: number;
  member_assignments_count: number;
  total_members_assigned: number;
  total_members_viewed: number;
  total_members_shared: number;
  total_members_saved: number;
}

const DISCOVERY_SUMMARY_COLUMNS =
  'opportunity_id, opportunity_code, campaign_id, creator_id, title, opportunity_status, ' +
  'starts_at, expires_at, community_assignments_count, member_assignments_count, ' +
  'total_members_assigned, total_members_viewed, total_members_shared, total_members_saved';

function toDiscoverySummary(row: DiscoverySummaryRow): DiscoverySummary {
  return {
    opportunityId: row.opportunity_id,
    opportunityCode: row.opportunity_code,
    campaignId: row.campaign_id,
    creatorId: row.creator_id,
    title: row.title,
    opportunityStatus: row.opportunity_status,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    communityAssignmentsCount: row.community_assignments_count,
    memberAssignmentsCount: row.member_assignments_count,
    totalMembersAssigned: row.total_members_assigned,
    totalMembersViewed: row.total_members_viewed,
    totalMembersShared: row.total_members_shared,
    totalMembersSaved: row.total_members_saved,
  };
}

export async function getDiscoverySummary(
  accessToken: string,
  opportunityId: string,
): Promise<DiscoverySummary | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('discovery_summary_view')
    .select(DISCOVERY_SUMMARY_COLUMNS)
    .eq('opportunity_id', opportunityId)
    .maybeSingle<DiscoverySummaryRow>();

  if (error || !data) {
    return null;
  }

  return toDiscoverySummary(data);
}

export async function listDiscoverySummaries(accessToken: string): Promise<DiscoverySummary[]> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('discovery_summary_view')
    .select(DISCOVERY_SUMMARY_COLUMNS)
    .returns<DiscoverySummaryRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(toDiscoverySummary);
}
