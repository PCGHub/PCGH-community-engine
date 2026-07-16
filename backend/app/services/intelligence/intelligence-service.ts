/**
 * Intelligence Domain Service, per Phase 5 Step 9's deliverable: wraps
 * api.badges_view, api.award_badge(), api.revoke_badge(),
 * api.calculate_member_reputation(), api.calculate_creator_reputation(),
 * api.calculate_community_reputation(), api.reputation_leaderboard_view,
 * and api.create_performance_bonus() (shared with Payment Domain --
 * Step 12 should import createPerformanceBonus from here rather than
 * re-wrapping the same procedure).
 *
 * Per the "API Schema First" principle, this queries the api schema
 * only -- never intelligence.* directly.
 *
 * Every mutating call (award/revoke badge, the three
 * calculate_*_reputation() functions, create_performance_bonus) is a
 * thin passthrough to a SECURITY DEFINER routine that already enforces
 * its own admin-only authorization internally. This service adds no
 * authorization decision of its own.
 *
 * Reputation scores are documented placeholders pending ADR-015 -- see
 * app/domains/intelligence/intelligence.ts's isProvisional field.
 *
 * api.reputation_leaderboard_view carries no admin filter of its own;
 * it relies on the underlying reputation tables' RLS
 * (member/creator: own row or admin; community: admin only,
 * migration 005). A non-admin caller therefore receives at most their
 * own row here, never a real ranked leaderboard -- this service does
 * not attempt to reconstruct or widen that (e.g. by calling this
 * per-user in a loop), per Step 9's exit criteria that the leaderboard
 * remains admin-only in practice, ADR-014 not worked around.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { Badge, ReputationLeaderboardEntry } from '../../domains/intelligence/intelligence';

interface BadgeRow {
  badge_id: string;
  badge_name: string;
  description: string | null;
  icon_url: string | null;
  category: string | null;
  criteria: string | null;
  created_at: string;
  updated_at: string;
}

function toBadge(row: BadgeRow): Badge {
  return {
    badgeId: row.badge_id,
    badgeName: row.badge_name,
    description: row.description,
    iconUrl: row.icon_url,
    category: row.category,
    criteria: row.criteria,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBadges(accessToken: string): Promise<Badge[]> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('badges_view')
    .select('badge_id, badge_name, description, icon_url, category, criteria, created_at, updated_at')
    .returns<BadgeRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map(toBadge);
}

interface ReputationLeaderboardRow {
  entity_type: 'creator' | 'member' | 'community';
  entity_id: string;
  entity_label: string | null;
  reputation_score: number;
  badge_total: number | null;
  rank: number;
}

export async function getReputationLeaderboard(accessToken: string): Promise<ReputationLeaderboardEntry[]> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('reputation_leaderboard_view')
    .select('entity_type, entity_id, entity_label, reputation_score, badge_total, rank')
    .returns<ReputationLeaderboardRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    reputationScore: row.reputation_score,
    badgeTotal: row.badge_total,
    rank: row.rank,
    isProvisional: true,
  }));
}

export async function awardBadge(
  accessToken: string,
  userId: string,
  badgeId: string,
  expiresAt?: string,
): Promise<string | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .rpc('award_badge', { p_user_id: userId, p_badge_id: badgeId, p_expires_at: expiresAt ?? null });

  if (error) {
    throw new Error(error.message);
  }

  return (data as string | null) ?? null;
}

export async function revokeBadge(accessToken: string, userId: string, badgeId: string): Promise<void> {
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('revoke_badge', { p_user_id: userId, p_badge_id: badgeId });

  if (error) {
    throw new Error(error.message);
  }
}

export async function recalculateMemberReputation(accessToken: string, userId: string): Promise<void> {
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('calculate_member_reputation', { p_user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
}

export async function recalculateCreatorReputation(accessToken: string, userId: string): Promise<void> {
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('calculate_creator_reputation', { p_user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
}

export async function recalculateCommunityReputation(accessToken: string, communityId: string): Promise<void> {
  const client = createSupabaseClient(accessToken);
  const { error } = await client
    .schema('api')
    .rpc('calculate_community_reputation', { p_community_id: communityId });

  if (error) {
    throw new Error(error.message);
  }
}

export interface CreatePerformanceBonusParams {
  readonly communityId: string;
  readonly campaignId: string;
  readonly bonusAmount: number;
  readonly reason: string;
  readonly approvedBy: string;
  readonly memberAllocations: readonly { userId: string; creditAmount: number }[];
}

/**
 * Shared with Payment Domain (Step 12) -- import this function rather
 * than re-wrapping api.create_performance_bonus() there.
 */
export async function createPerformanceBonus(
  accessToken: string,
  params: CreatePerformanceBonusParams,
): Promise<void> {
  const client = createSupabaseClient(accessToken);
  const { error } = await client.schema('api').rpc('create_performance_bonus', {
    p_community_id: params.communityId,
    p_campaign_id: params.campaignId,
    p_bonus_amount: params.bonusAmount,
    p_reason: params.reason,
    p_approved_by: params.approvedBy,
    p_member_allocations: params.memberAllocations.map((a) => ({
      user_id: a.userId,
      credit_amount: a.creditAmount,
    })),
  });

  if (error) {
    throw new Error(error.message);
  }
}
