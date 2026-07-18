/**
 * Generic request-validation primitives, per docs/api-specification.md
 * Section 6.
 *
 * These are type-guard-level primitives only -- no endpoint-specific
 * knowledge of what a given request body should look like. Deciding
 * which fields a given endpoint requires, and which primitive checks
 * each one, stays inline in that endpoint's own route handler, per
 * Section 6's rule that validation logic is "not extracted into a
 * shared 'validator' module." Only these primitives are shared; the
 * composition is not.
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Returns the subset of `fields` that are missing, null, or undefined
 * on `body`. Does not check type -- pair with the type guards above
 * for that, per field, inline in the calling endpoint.
 */
export function getMissingFields(body: Record<string, unknown>, fields: readonly string[]): string[] {
  return fields.filter((field) => body[field] === undefined || body[field] === null);
}

/**
 * Safely parses a request body as JSON, returning null (not throwing)
 * on malformed input, so callers can respond 400 rather than 500 for
 * a client mistake.
 */
export async function parseJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
