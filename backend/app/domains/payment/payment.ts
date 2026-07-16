/**
 * Payment Domain Model, per docs/domain-architecture.md's Payment
 * Domain: shape returned by api.wallet_summary_view. No logic -- data
 * shape only. See app/services/payment/ for the Payment Application
 * Service.
 */

export interface WalletSummary {
  readonly walletId: string;
  readonly userId: string;
  readonly currentBalance: number;
  readonly lifetimeEarned: number;
  readonly lifetimeSpent: number;
  readonly availableCredits: number;
  readonly totalBonusCreditsReceived: number;
}
