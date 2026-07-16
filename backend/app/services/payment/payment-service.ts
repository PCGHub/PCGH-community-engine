/**
 * Payment Application Service, per Phase 5 Step 12's deliverable: wraps
 * api.wallet_summary_view and api.calculate_wallet_balance(). Per the
 * "API Schema First" principle, this queries the api schema only --
 * never economy.* directly.
 *
 * api.create_performance_bonus() is shared with Intelligence Domain
 * (Step 9) -- re-exported here rather than re-wrapped, per that
 * step's own comment that Step 12 should import, not duplicate, it.
 *
 * Flutterwave integration for credit purchase is deliberately NOT
 * implemented in this step. See this step's Founder-facing report for
 * why: there is no api.* procedure to credit economy.credit_wallets
 * from a verified purchase (only api.create_performance_bonus()
 * credits wallets, and only for bonus allocations). Building payment
 * verification without a corresponding crediting procedure would still
 * leave "credit purchase" non-functional, and adding that procedure
 * now would mean inventing new architecture outside this step's scope
 * -- per Step 12's own Dependencies note, that requires an Architecture
 * Change Lifecycle proposal, not an application-layer workaround.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { WalletSummary } from '../../domains/payment/payment';

export { createPerformanceBonus } from '../intelligence/intelligence-service';
export type { CreatePerformanceBonusParams } from '../intelligence/intelligence-service';

interface WalletSummaryRow {
  wallet_id: string;
  user_id: string;
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  available_credits: number;
  total_bonus_credits_received: number;
}

const WALLET_SUMMARY_COLUMNS =
  'wallet_id, user_id, current_balance, lifetime_earned, lifetime_spent, ' +
  'available_credits, total_bonus_credits_received';

function toWalletSummary(row: WalletSummaryRow): WalletSummary {
  return {
    walletId: row.wallet_id,
    userId: row.user_id,
    currentBalance: row.current_balance,
    lifetimeEarned: row.lifetime_earned,
    lifetimeSpent: row.lifetime_spent,
    availableCredits: row.available_credits,
    totalBonusCreditsReceived: row.total_bonus_credits_received,
  };
}

export async function getWalletSummary(accessToken: string, userId: string): Promise<WalletSummary | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('wallet_summary_view')
    .select(WALLET_SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle<WalletSummaryRow>();

  if (error || !data) {
    return null;
  }

  return toWalletSummary(data);
}

export async function getWalletBalance(accessToken: string, userId: string): Promise<number | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client.schema('api').rpc('calculate_wallet_balance', { p_user_id: userId });

  if (error || data === null) {
    return null;
  }

  return data as number;
}
