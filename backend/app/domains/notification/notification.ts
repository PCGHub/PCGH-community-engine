/**
 * Notification Domain Model, per docs/domain-architecture.md's
 * Notification Domain: Notification Domain owns no business schema --
 * its only data source is the event stream
 * (analytics.analytics_events). No logic here -- data shape only. See
 * app/services/notification/ for the Notification Application Service.
 */

export type GovernedEventType =
  | 'USER_CREATED'
  | 'CAMPAIGN_CREATED'
  | 'DISCOVERY_ASSIGNED'
  | 'DISCOVERY_VIEWED'
  | 'DISCOVERY_SHARED'
  | 'BONUS_GRANTED'
  | 'BADGE_AWARDED';

export interface AnalyticsEvent {
  readonly id: string;
  readonly eventType: GovernedEventType;
  readonly userId: string | null;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly metadata: unknown;
  readonly createdAt: string;
}

export interface NotificationContent {
  readonly recipientUserId: string;
  readonly subject: string;
  readonly body: string;
  readonly sourceEventId: string;
  readonly eventType: GovernedEventType;
}
