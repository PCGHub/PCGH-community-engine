/**
 * Analytics Domain Models, per docs/domain-architecture.md's Analytics
 * Domain: shapes returned by api.platform_statistics_view and
 * api.community_dashboard_view. No logic -- data shape only. See
 * app/services/analytics/ for the Analytics Domain Service.
 *
 * `activeCampaignsCount` and `historicalPerformance` on
 * CommunityDashboard are RLS-restricted: a non-admin caller who is not
 * the relevant creator sees 0 / null respectively (RLS on
 * discovery.discovery_opportunities and
 * protection.community_performance_history, not this domain). That is
 * a correct empty state, not missing data -- do not backfill it.
 *
 * Documentation consistency note (Phase 6 API Foundation Coverage
 * Review, 2026-07-18): PlatformStatistics.avgMemberReputation/
 * avgCreatorTrustScore and CommunityDashboard.reputationScore/
 * activityScore/consistencyScore/trustScore are sourced from the same
 * reputation-scoring tables (intelligence.member_reputation,
 * creator_reputation, community_reputation) that
 * ReputationLeaderboardEntry.isProvisional marks provisional pending
 * ADR-015 (app/domains/intelligence/intelligence.ts). These fields
 * carry the identical caveat even though this type has no
 * isProvisional field of its own: the formulas behind every number
 * here remain a documented placeholder, not final, pending Chief
 * Architect definition. No response shape, RLS, or scoring behavior
 * changed by this note -- it is a labeling correction only.
 */

export interface PlatformStatistics {
  readonly totalUsers: number;
  readonly totalCreators: number;
  readonly totalCommunities: number;
  readonly totalCampaigns: number;
  readonly activeCampaigns: number;
  readonly totalCreditsPurchased: number;
  readonly totalCreditsSpent: number;
  readonly totalDiscoveryOpportunities: number;
  readonly totalMemberAssignments: number;
  readonly totalCompletedAssignments: number;
  readonly avgMemberReputation: number | null;
  readonly avgCreatorTrustScore: number | null;
}

export interface CommunityPerformanceRecord {
  readonly campaignId: string;
  readonly engagementRate: number | null;
  readonly performanceScore: number | null;
  readonly recordedAt: string;
}

export interface CommunityDashboard {
  readonly communityId: string;
  readonly communityCode: string;
  readonly name: string;
  readonly status: string;
  readonly memberCount: number;
  readonly reputationScore: number | null;
  readonly activityScore: number | null;
  readonly consistencyScore: number | null;
  readonly trustScore: number | null;
  readonly activeCampaignsCount: number;
  readonly participationRate: number;
  readonly discoveriesViewed: number;
  readonly discoveriesShared: number;
  readonly discoveriesSaved: number;
  readonly historicalPerformance: readonly CommunityPerformanceRecord[] | null;
}
