import { buildNotificationContent } from '../../../app/services/notification/notification-service';
import type { AnalyticsEvent } from '../../../app/domains/notification/notification';

describe('Notification Service: buildNotificationContent', () => {
  it('maps a DISCOVERY_ASSIGNED event to notification content addressed to its own user_id', () => {
    const event: AnalyticsEvent = {
      id: 'evt-1',
      eventType: 'DISCOVERY_ASSIGNED',
      userId: 'user-1',
      entityType: 'discovery_opportunity',
      entityId: 'opp-1',
      metadata: null,
      createdAt: '2026-01-01T00:00:00Z',
    };

    const content = buildNotificationContent(event);

    expect(content?.recipientUserId).toBe('user-1');
    expect(content?.sourceEventId).toBe('evt-1');
  });

  it('returns null for an event with no recipient, never inventing one', () => {
    const event: AnalyticsEvent = {
      id: 'evt-2',
      eventType: 'DISCOVERY_ASSIGNED',
      userId: null,
      entityType: null,
      entityId: null,
      metadata: null,
      createdAt: '2026-01-01T00:00:00Z',
    };

    expect(buildNotificationContent(event)).toBeNull();
  });

  it('returns null for an event type with no defined mapping yet, rather than guessing', () => {
    const event: AnalyticsEvent = {
      id: 'evt-3',
      eventType: 'BONUS_GRANTED',
      userId: 'user-1',
      entityType: null,
      entityId: null,
      metadata: null,
      createdAt: '2026-01-01T00:00:00Z',
    };

    expect(buildNotificationContent(event)).toBeNull();
  });
});
