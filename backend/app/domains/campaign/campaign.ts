/**
 * Campaign Domain Models, per docs/domain-architecture.md's Campaign
 * Domain: shapes returned by api.campaign_summary_view and
 * api.calculate_campaign_performance(). No logic -- data shape only.
 * See app/services/campaign/ for the Campaign Application Service.
 */

export interface CampaignSummary {
  readonly campaignId: string;
  readonly campaignCode: string;
  readonly title: string;
  readonly campaignType: string;
  readonly campaignStatus: string;
  readonly creditsBudget: number;
  readonly creditsSpent: number;
  readonly durationHours: number;
  readonly createdAt: string;
  readonly creatorId: string;
  readonly creatorUsername: string;
  readonly creatorFullName: string | null;
  readonly communitiesReached: number;
  readonly avgPerformanceScore: number | null;
  readonly totalMembersViewed: number;
  readonly totalMembersShared: number;
  readonly totalMembersSaved: number;
}

export interface CampaignPerformance {
  readonly membersAssigned: number;
  readonly membersViewed: number;
  readonly membersShared: number;
  readonly membersSaved: number;
  readonly avgPerformanceScore: number | null;
}
