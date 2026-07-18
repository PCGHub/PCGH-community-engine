/**
 * Centralized error handling, per docs/api-specification.md Section 7
 * ("Error Classification," TD-005 resolution, 2026-07-18).
 *
 * Two classification paths, in order:
 *   1. Typed errors (NotFoundError, ConflictError, ForbiddenError) --
 *      an explicit, non-fragile escape hatch a future service MAY
 *      throw directly. No current Phase 5 service throws these; they
 *      exist for forward compatibility, not retrofitted here.
 *   2. Message-pattern fallback, for the plain Error every current
 *      mutating domain service function already throws, unmodified --
 *      based on two conventions verified identical across every
 *      audited routine in both the Campaign and Intelligence domains
 *      (see api-specification.md's audit): every admin-gate message
 *      starts with "Only administrators may "; every not-found
 *      message ends with "not found". Anything else classifies as
 *      500, with the real message logged server-side but never
 *      returned to the client.
 *
 * Security: distinguishing 403 from 404 here is safe -- audited and
 * confirmed that in every current routine, the admin check always
 * runs and fails before any existence check, so a non-admin caller
 * always receives 403 regardless of whether the resource exists.
 * Only an already-privileged admin (full RLS visibility) can ever see
 * a 404 from this path. Reads are unaffected: a null return still
 * maps to 404 exactly as before, at the call site, not here.
 */

import type { NextResponse } from 'next/server';
import { logger } from '../../utils/logger';
import { apiError } from './response';

export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ForbiddenError extends Error {}

export interface ErrorLogContext {
  readonly requestId: string;
  readonly route: string;
}

const ADMIN_ONLY_PREFIX = 'Only administrators may ';
const NOT_FOUND_SUFFIX = /not found$/i;

interface Classification {
  readonly status: number;
  readonly code: string;
}

function classify(error: Error): Classification {
  if (error instanceof NotFoundError) {
    return { status: 404, code: 'NOT_FOUND' };
  }
  if (error instanceof ConflictError) {
    return { status: 409, code: 'CONFLICT' };
  }
  if (error instanceof ForbiddenError) {
    return { status: 403, code: 'FORBIDDEN' };
  }

  if (error.message.startsWith(ADMIN_ONLY_PREFIX)) {
    return { status: 403, code: 'FORBIDDEN' };
  }
  if (NOT_FOUND_SUFFIX.test(error.message.trim())) {
    return { status: 404, code: 'NOT_FOUND' };
  }

  return { status: 500, code: 'INTERNAL_ERROR' };
}

export function handleServiceError(error: unknown, context: ErrorLogContext): NextResponse {
  if (error instanceof Error) {
    const { status, code } = classify(error);
    const clientMessage = status === 500 ? 'An unexpected error occurred' : error.message;
    logger.error('api.request.failed', { ...context, status, message: error.message });
    return apiError(code, clientMessage, status);
  }

  logger.error('api.request.failed', { ...context, status: 500, message: 'Unexpected error' });
  return apiError('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}
