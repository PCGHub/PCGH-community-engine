/**
 * Audit event recording, per docs/backend-architecture.md's
 * "Observability" section ("Every critical operation should produce...
 * audit records").
 *
 * There is no durable `audit` schema yet -- CLAUDE.md's "Future
 * schemas" explicitly lists `audit` as not-yet-created, alongside
 * `notifications`, `system`, `ai`. Adding one now would be a new
 * migration/architecture decision, not something Deployment
 * Preparation invents. This records audit-shaped structured log
 * entries (via the existing logger) as an interim, swappable behind
 * this same function signature -- once an `audit` schema and an
 * `api.*` write path exist, this function's implementation changes,
 * not its callers.
 *
 * Called from every critical mutating operation (Campaign, Intelligence
 * services; the notification dispatch job) -- see
 * docs/technical-debt.md TD-003 for the resolution record.
 */

import { logger } from './logger';

export interface AuditEvent {
  readonly actorUserId: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly metadata?: Record<string, unknown>;
}

export function recordAuditEvent(event: AuditEvent): void {
  logger.info('audit_event', { audit: true, ...event });
}
