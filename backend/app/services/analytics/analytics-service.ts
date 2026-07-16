/**
 * Analytics Domain Service, per Phase 5 Step 10's deliverable: wraps
 * api.platform_statistics_view (administrator-only) and
 * api.community_dashboard_view. Per the "API Schema First" principle,
 * this queries the api schema only -- never analytics.*, discovery.*,
 * or protection.* directly.
 *
 * Analytics is a rollup layer, not a source of truth (ADR-008,
 * app/domains/analytics/README.md) -- this service does not recompute
 * any business fact; it reads the two views as-is.
 *
 * api.platform_statistics_view filters to zero rows for non-admins via
 * `where identity.is_admin()` -- this is not an error case, and this
 * service adds no redundant admin check of its own.
 *
 * api.community_dashboard_view's activeCampaignsCount and
 * historicalPerformance depend on RLS on discovery.discovery_opportunities
 * and protection.community_performance_history (creator/admin only).
 * A non-admin, non-owning caller legitimately sees 0 / null for those
 * fields -- this service passes that through unchanged rather than
 * working around it (e.g. by querying another table to "fill in" the
 * value), per Step 10's exit criteria.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { CommunityDashboard, PlatformStatistics } from '../../domains/analytics/analytics';

interface PlatformStatisticsRow {
  total_users: number;
  total_creators: number;
  total_communities: number;
  total_campaigns: number;
  active_campaigns: number;
  total_credits_purchased: number;
  total_credits_spent: number;
  total_discovery_opportunities: number;
  total_member_assignments: number;
  total_completed_assignments: number;
  avg_member_reputation: number | null;
  avg_creator_trust_score: number | null;
}

const PLATFORM_STATISTICS_COLUMNS =
  'total_users, total_creators, total_communities, total_campaigns, active_campaigns, ' +
  'total_credits_purchased, total_credits_spent, total_discovery_opportunities, ' +
  'total_member_assignments, total_completed_assignments, avg_member_reputation, ' +
  'avg_creator_trust_score';

function toPlatformStatistics(row: PlatformStatisticsRow): PlatformStatistics {
  return {
    totalUsers: row.total_users,
    totalCreators: row.total_creators,
    totalCommunities: row.total_communities,
    totalCampaigns: row.total_campaigns,
    activeCampaigns: row.active_campaigns,
    totalCreditsPurchased: row.total_credits_purchased,
    totalCreditsSpent: row.total_credits_spent,
    totalDiscoveryOpportunities: row.total_discovery_opportunities,
    totalMemberAssignments: row.total_member_assignments,
    totalCompletedAssignments: row.total_completed_assignments,
    avgMemberReputation: row.avg_member_reputation,
    avgCreatorTrustScore: row.avg_creator_trust_score,
  };
}

/**
 * Returns null for non-administrators -- the view itself filters to
 * zero rows (`where identity.is_admin()`). Not an error.
 */
export async function getPlatformStatistics(accessToken: string): Promise<PlatformStatistics | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('platform_statistics_view')
    .select(PLATFORM_STATISTICS_COLUMNS)
    .maybeSingle<PlatformStatisticsRow>();

  if (error || !data) {
    return null;
  }

  return toPlatformStatistics(data);
}

interface CommunityPerformanceRecordRow {
  campaign_id: string;
  engagement_rate: number | null;
  performance_score: number | null;
  recorded_at: string;
}

interface CommunityDashboardRow {
  community_id: string;
  community_code: string;
  name: string;
  status: string;
  member_count: number;
  reputation_score: number | null;
  activity_score: number | null;
  consistency_score: number | null;
  trust_score: number | null;
  active_campaigns_count: number;
  participation_rate: number;
  discoveries_viewed: number;
  discoveries_shared: number;
  discoveries_saved: number;
  historical_performance: CommunityPerformanceRecordRow[] | null;
}

const COMMUNITY_DASHBOARD_COLUMNS =
  'community_id, community_code, name, status, member_count, reputation_score, ' +
  'activity_score, consistency_score, trust_score, active_campaigns_count, ' +
  'participation_rate, discoveries_viewed, discoveries_shared, discoveries_saved, ' +
  'historical_performance';

function toCommunityDashboard(row: CommunityDashboardRow): CommunityDashboard {
  return {
    communityId: row.community_id,
    communityCode: row.community_code,
    name: row.name,
    status: row.status,
    memberCount: row.member_count,
    reputationScore: row.reputation_score,
    activityScore: row.activity_score,
    consistencyScore: row.consistency_score,
    trustScore: row.trust_score,
    activeCampaignsCount: row.active_campaigns_count,
    participationRate: row.participation_rate,
    discoveriesViewed: row.discoveries_viewed,
    discoveriesShared: row.discoveries_shared,
    discoveriesSaved: row.discoveries_saved,
    historicalPerformance: row.historical_performance
      ? row.historical_performance.map((r) => ({
          campaignId: r.campaign_id,
          engagementRate: r.engagement_rate,
          performanceScore: r.performance_score,
          recordedAt: r.recorded_at,
        }))
      : null,
  };
}

export async function getCommunityDashboard(
  accessToken: string,
  communityId: string,
): Promise<CommunityDashboard | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('community_dashboard_view')
    .select(COMMUNITY_DASHBOARD_COLUMNS)
    .eq('community_id', communityId)
    .maybeSingle<CommunityDashboardRow>();

  if (error || !data) {
    return null;
  }

  return toCommunityDashboard(data);
}

export async function listCommunityDashboards(accessToken: string): Promise<CommunityDashboard[]> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('community_dashboard_view')
    .select(COMMUNITY_DASHBOARD_COLUMNS)
    .returns<CommunityDashboardRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(toCommunityDashboard);
}
