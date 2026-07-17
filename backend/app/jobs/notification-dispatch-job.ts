/**
 * Notification dispatch background job, per Phase 5 Step 11's
 * deliverable: "Event-driven triggers consuming
 * analytics.analytics_events."
 *
 * This is the one file in Step 11 that reads a business schema
 * directly rather than through the api schema, and the one file that
 * uses the service_role client. Both are deliberate, documented
 * exceptions, not workarounds:
 *
 *   - analytics.analytics_events has no api.* view, and its RLS
 *     (analytics_events_admin_select, migration 006) is
 *     administrator-only -- a normal user's session token cannot read
 *     it at all.
 *   - docs/domain-architecture.md's Notification Domain explicitly
 *     names `analytics.analytics_events` (read) as its one direct
 *     dependency, since the domain owns no business schema of its own
 *     to route this through.
 *   - A background job has no per-request user session to begin with
 *     -- it must run as trusted backend automation, which is exactly
 *     the documented, narrow use case for the service_role client
 *     (config/supabase.ts: "trusted backend automation (scheduled
 *     jobs, internal service-to-service calls)"). This file is a
 *     background job by construction and is never client-reachable.
 *
 * See docs/technical-debt.md TD-002.
 *
 * Idempotent and retry-safe (docs/backend-architecture.md, "Background
 * Jobs"): callers pass a `sinceCreatedAt` cursor and only events after
 * it are processed; re-running with the same cursor reprocesses the
 * same set rather than skipping or duplicating based on side effects.
 *
 * Observability (docs/technical-debt.md TD-003): records a structured
 * log on a batch fetch failure, and an audit event + metric per
 * dispatched event, using the existing
 * app/utils/{logger,audit,metrics,tracing} utilities exactly as
 * designed -- no new logging framework, no change to this function's
 * signature or return type.
 */

import { createSupabaseServiceClient } from '../config/supabase';
import type { AnalyticsEvent } from '../domains/notification/notification';
import { getEmailProvider } from '../notifications/email-provider';
import { buildNotificationContent } from '../services/notification/notification-service';
import { recordAuditEvent } from '../utils/audit';
import { logger } from '../utils/logger';
import { recordMetric } from '../utils/metrics';
import { generateRequestId } from '../utils/tracing';

interface AnalyticsEventRow {
  id: string;
  event_type: AnalyticsEvent['eventType'];
  user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
}

function toAnalyticsEvent(row: AnalyticsEventRow): AnalyticsEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    userId: row.user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export interface DispatchResult {
  readonly eventId: string;
  readonly dispatched: boolean;
  readonly reason?: string;
}

/**
 * Fetches events created after `sinceCreatedAt` and attempts to
 * dispatch a notification for each. Returns a per-event result rather
 * than throwing on the first failure, so one event never blocks the
 * rest of the batch.
 */
export async function runNotificationDispatch(sinceCreatedAt: string): Promise<DispatchResult[]> {
  const requestId = generateRequestId();
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .schema('analytics')
    .from('analytics_events')
    .select('id, event_type, user_id, entity_type, entity_id, metadata, created_at')
    .gt('created_at', sinceCreatedAt)
    .order('created_at', { ascending: true })
    .returns<AnalyticsEventRow[]>();

  if (error || !data) {
    logger.error('notification.dispatch.fetch_failed', { requestId, sinceCreatedAt, error: error?.message });
    return [];
  }

  const provider = getEmailProvider();
  const results: DispatchResult[] = [];

  for (const row of data) {
    const event = toAnalyticsEvent(row);
    const content = buildNotificationContent(event);

    if (!content) {
      results.push({ eventId: event.id, dispatched: false, reason: 'No notification mapping for this event type' });
      continue;
    }

    const delivery = await provider.send(content.recipientUserId, content.subject, content.body);
    results.push({ eventId: event.id, dispatched: delivery.delivered, reason: delivery.reason });

    recordAuditEvent({
      actorUserId: null,
      action: 'notification.dispatch',
      entityType: 'analytics_event',
      entityId: event.id,
      metadata: { eventType: event.eventType, dispatched: delivery.delivered, reason: delivery.reason, requestId },
    });
    recordMetric('notification.dispatched', delivery.delivered ? 1 : 0, { eventType: event.eventType });
  }

  return results;
}
