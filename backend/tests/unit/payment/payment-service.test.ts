import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseClient: jest.fn(),
}));

import { createSupabaseClient } from '../../../app/config/supabase';
import { getWalletBalance, getWalletSummary } from '../../../app/services/payment/payment-service';

const mockCreateSupabaseClient = createSupabaseClient as jest.Mock;

describe('Payment Service', () => {
  it('getWalletSummary maps a wallet_summary_view row to camelCase', async () => {
    mockCreateSupabaseClient.mockReturnValue(
      createMockSupabaseClient({
        query: {
          data: {
            wallet_id: 'w1',
            user_id: 'u1',
            current_balance: 100,
            lifetime_earned: 200,
            lifetime_spent: 100,
            available_credits: 150,
            total_bonus_credits_received: 50,
          },
          error: null,
        },
      }),
    );

    const summary = await getWalletSummary('token', 'u1');

    expect(summary).toEqual({
      walletId: 'w1',
      userId: 'u1',
      currentBalance: 100,
      lifetimeEarned: 200,
      lifetimeSpent: 100,
      availableCredits: 150,
      totalBonusCreditsReceived: 50,
    });
  });

  it('getWalletBalance reads live from api.calculate_wallet_balance(), no direct table read', async () => {
    const client = createMockSupabaseClient({ rpc: { data: 42, error: null } });
    mockCreateSupabaseClient.mockReturnValue(client);

    const balance = await getWalletBalance('token', 'u1');

    expect(balance).toBe(42);
    expect(client.rpc).toHaveBeenCalledWith('calculate_wallet_balance', { p_user_id: 'u1' });
  });
});
