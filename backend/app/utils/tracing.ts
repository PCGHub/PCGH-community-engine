/**
 * Tracing identifiers, per docs/backend-architecture.md's
 * "Observability" section ("Every critical operation should
 * produce... tracing identifiers").
 *
 * A minimal, vendor-neutral request identifier -- not a full
 * distributed-tracing integration (e.g. OpenTelemetry), which would be
 * a new External Integration decision beyond this step's scope.
 * Callers pass the returned id as a `requestId` field to
 * app/utils/logger.ts so related log lines can be correlated.
 */

import { randomUUID } from 'crypto';

export function generateRequestId(): string {
  return randomUUID();
}
