/**
 * Notification Application Service, per Phase 5 Step 11's deliverable.
 * Pure content-mapping logic: given an already-fetched
 * analytics.analytics_events row, derives the notification to send.
 * Takes no dependency on the database itself -- the event-consuming
 * trigger (app/jobs/notification-dispatch-job.ts) fetches events and
 * calls this.
 *
 * No business rule is duplicated: content is derived only from fields
 * already present on the event row. This function never queries
 * another domain's data to enrich content (e.g. it does not fetch a
 * discovery opportunity's title from the Discovery Domain) --
 * Notification Domain owns no business schema of its own
 * (app/domains/notification/README.md), so it must not reach into
 * another domain's data to compensate.
 *
 * Notification ownership is never bypassed: the recipient is always
 * exactly the event's own user_id, verbatim -- there is no parameter
 * or code path that lets a caller redirect a notification to a
 * different recipient.
 */

import type { AnalyticsEvent, NotificationContent } from '../../domains/notification/notification';

/**
 * Returns null when the event has no recipient, or when no
 * notification mapping is yet defined for its event type -- new
 * mappings are added here as other domains' event types are actually
 * emitted, not speculatively invented ahead of that.
 */
export function buildNotificationContent(event: AnalyticsEvent): NotificationContent | null {
  if (!event.userId) {
    return null;
  }

  switch (event.eventType) {
    case 'DISCOVERY_ASSIGNED':
      return {
        recipientUserId: event.userId,
        subject: 'New discovery opportunity assigned',
        body: `You have been assigned a new discovery opportunity (reference ${event.entityId ?? event.id}).`,
        sourceEventId: event.id,
        eventType: event.eventType,
      };
    default:
      return null;
  }
}
