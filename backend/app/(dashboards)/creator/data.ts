/**
 * Full api.creator_dashboard_view read, for the Creator Dashboard page
 * only. docs/domain-architecture.md marks this view "Cross-domain (no
 * single owner -- aggregates multiple domains): wallet + reputation +
 * campaigns + badges (Identity, Payment, Campaign, Intelligence)" --
 * Identity Service's getCreatorProfile() intentionally reads only the
 * profile-field slice it owns (app/services/identity/profile-service.ts),
 * so this page-local reader covers the rest rather than expanding
 * Identity Service beyond its documented boundary or duplicating its
 * profile-field mapping.
 *
 * Per the "API Schema First" principle, this queries the api schema
 * only.
 */

import { createSupabaseServerComponentClient } from '../../config/supabase-server';

export interface CreatorDashboard {
  readonly userId: string;
  readonly userCode: string;
  readonly username: string;
  readonly fullName: string | null;
  readonly avatarUrl: string | null;
  readonly status: string;
  readonly walletBalance: number | null;
  readonly walletBonusBalance: number | null;
  readonly walletLifetimePurchased: number | null;
  readonly walletLifetimeSpent: number | null;
  readonly campaignScore: number | null;
  readonly qualityScore: number | null;
  readonly consistencyScore: number | null;
  readonly trustScore: number | null;
  readonly communitiesReached: number;
  readonly membersReached: number;
  readonly viewsGenerated: number;
  readonly sharesGenerated: number;
  readonly savesGenerated: number;
  readonly amplificationScore: number;
  readonly activeCampaignsCount: number;
  readonly earnedBadges: readonly string[];
}

interface CreatorDashboardRow {
  user_id: string;
  user_code: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  wallet_balance: number | null;
  wallet_bonus_balance: number | null;
  wallet_lifetime_purchased: number | null;
  wallet_lifetime_spent: number | null;
  campaign_score: number | null;
  quality_score: number | null;
  consistency_score: number | null;
  trust_score: number | null;
  communities_reached: number;
  members_reached: number;
  views_generated: number;
  shares_generated: number;
  saves_generated: number;
  amplification_score: number;
  active_campaigns_count: number;
  earned_badges: string[];
}

const CREATOR_DASHBOARD_COLUMNS =
  'user_id, user_code, username, full_name, avatar_url, status, wallet_balance, ' +
  'wallet_bonus_balance, wallet_lifetime_purchased, wallet_lifetime_spent, campaign_score, ' +
  'quality_score, consistency_score, trust_score, communities_reached, members_reached, ' +
  'views_generated, shares_generated, saves_generated, amplification_score, ' +
  'active_campaigns_count, earned_badges';

export async function getOwnCreatorDashboard(): Promise<CreatorDashboard | null> {
  const client = createSupabaseServerComponentClient();
  const { data, error } = await client
    .schema('api')
    .from('creator_dashboard_view')
    .select(CREATOR_DASHBOARD_COLUMNS)
    .maybeSingle<CreatorDashboardRow>();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    userCode: data.user_code,
    username: data.username,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    status: data.status,
    walletBalance: data.wallet_balance,
    walletBonusBalance: data.wallet_bonus_balance,
    walletLifetimePurchased: data.wallet_lifetime_purchased,
    walletLifetimeSpent: data.wallet_lifetime_spent,
    campaignScore: data.campaign_score,
    qualityScore: data.quality_score,
    consistencyScore: data.consistency_score,
    trustScore: data.trust_score,
    communitiesReached: data.communities_reached,
    membersReached: data.members_reached,
    viewsGenerated: data.views_generated,
    sharesGenerated: data.shares_generated,
    savesGenerated: data.saves_generated,
    amplificationScore: data.amplification_score,
    activeCampaignsCount: data.active_campaigns_count,
    earnedBadges: data.earned_badges ?? [],
  };
}
