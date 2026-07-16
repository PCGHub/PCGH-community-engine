import { createMockSupabaseClient } from '../../helpers/mock-supabase-client';

jest.mock('../../../app/config/supabase', () => ({
  createSupabaseServiceClient: jest.fn(),
}));

import { createSupabaseServiceClient } from '../../../app/config/supabase';
import { runNotificationDispatch } from '../../../app/jobs/notification-dispatch-job';

const mockCreateSupabaseServiceClient = createSupabaseServiceClient as jest.Mock;

describe('Notification dispatch job', () => {
  it('reads analytics.analytics_events via the service_role client and reports an unconfigured delivery honestly', async () => {
    const client = createMockSupabaseClient({
      query: {
        data: [
          {
            id: 'evt-1',
            event_type: 'DISCOVERY_ASSIGNED',
            user_id: 'user-1',
            entity_type: 'discovery_opportunity',
            entity_id: 'opp-1',
            metadata: null,
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        error: null,
      },
    });
    mockCreateSupabaseServiceClient.mockReturnValue(client);

    const results = await runNotificationDispatch('2025-12-31T00:00:00Z');

    expect(client.schema).toHaveBeenCalledWith('analytics');
    expect(client.from).toHaveBeenCalledWith('analytics_events');
    expect(results).toEqual([
      {
        eventId: 'evt-1',
        dispatched: false,
        reason: 'No email provider configured -- Future External Integration, pending an Architecture Change Lifecycle decision.',
      },
    ]);
  });

  it('returns an empty result set rather than throwing when the query errors', async () => {
    mockCreateSupabaseServiceClient.mockReturnValue(
      createMockSupabaseClient({ query: { data: null, error: { message: 'read failed' } } }),
    );

    const results = await runNotificationDispatch('2025-12-31T00:00:00Z');

    expect(results).toEqual([]);
  });
});
