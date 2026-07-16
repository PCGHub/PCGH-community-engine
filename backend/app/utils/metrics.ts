/**
 * Metrics recording, per docs/backend-architecture.md's
 * "Observability" section ("Every critical operation should
 * produce... metrics").
 *
 * "Monitoring platform" is listed as a *Future* External Integration
 * (docs/backend-architecture.md, "External Integrations") -- no
 * vendor (Datadog, Prometheus, a hosted APM) is approved yet. This
 * records structured metric log lines via the existing logger, same
 * pattern as app/ai/client.ts and app/notifications/email-provider.ts:
 * an interface that doesn't invent an unapproved vendor decision.
 */

import { logger } from './logger';

export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  logger.info('metric', { metric: true, name, value, tags });
}
