/**
 * Discovery Domain Model, per docs/domain-architecture.md's Discovery
 * Domain: shape returned by api.discovery_summary_view. No logic --
 * data shape only. See app/services/discovery/ for the Discovery
 * Domain Service.
 */

export interface DiscoverySummary {
  readonly opportunityId: string;
  readonly opportunityCode: string;
  readonly campaignId: string;
  readonly creatorId: string;
  readonly title: string;
  readonly opportunityStatus: string;
  readonly startsAt: string | null;
  readonly expiresAt: string | null;
  readonly communityAssignmentsCount: number;
  readonly memberAssignmentsCount: number;
  readonly totalMembersAssigned: number;
  readonly totalMembersViewed: number;
  readonly totalMembersShared: number;
  readonly totalMembersSaved: number;
}
