/**
 * Intelligence Domain Models, per docs/domain-architecture.md's
 * Intelligence Domain: shapes returned by api.badges_view and
 * api.reputation_leaderboard_view. No logic -- data shape only. See
 * app/services/intelligence/ for the Intelligence Domain Service.
 *
 * Reputation scoring formulas are documented placeholders pending
 * ADR-015 (`008_create_api_schema.sql`'s calculate_*_reputation()
 * comments: "Placeholder ... formula pending Chief Architect
 * definition"). `isProvisional` is carried on the type itself, not
 * left to a comment a future UI could miss, so any consumer is forced
 * to see that these scores are not final.
 */

export interface Badge {
  readonly badgeId: string;
  readonly badgeName: string;
  readonly description: string | null;
  readonly iconUrl: string | null;
  readonly category: string | null;
  readonly criteria: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ReputationEntityType = 'creator' | 'member' | 'community';

export interface ReputationLeaderboardEntry {
  readonly entityType: ReputationEntityType;
  readonly entityId: string;
  readonly entityLabel: string | null;
  readonly reputationScore: number;
  readonly badgeTotal: number | null;
  readonly rank: number;
  /** Pending ADR-015 -- never present this score as final. */
  readonly isProvisional: true;
}
