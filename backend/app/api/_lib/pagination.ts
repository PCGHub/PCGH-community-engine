/**
 * Controller-level pagination, per docs/api-specification.md Section 7:
 * list endpoints include a `pagination` field, but no Phase 5 `list*`
 * domain service accepts limit/offset or returns a total -- each
 * already fetches everything the caller's RLS allows in one call.
 *
 * Rather than modify a domain service (out of EWP-002's scope --
 * "reuse the established... infrastructure," not change it), this
 * slices the already-fully-fetched array at the controller boundary,
 * which is exactly a controller's job (Section 1, step 5: "format the
 * response"). This does not reduce the underlying query cost for a
 * very large dataset; true server-side pagination in the domain
 * service remains better long-term and is not solved here.
 */

export interface PaginationParams {
  readonly limit: number;
  readonly offset: number;
}

export interface PaginatedResult<T> {
  readonly items: T[];
  readonly total: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses `limit`/`offset` query params from a request URL, clamping to
 * sane bounds. Invalid or missing values fall back to the defaults
 * rather than erroring -- pagination parameters are not required
 * request input (Section 6 only requires validating a request body).
 */
export function parsePaginationParams(url: URL): PaginationParams {
  const limitParam = Number(url.searchParams.get('limit'));
  const offsetParam = Number(url.searchParams.get('offset'));

  const limit = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isInteger(offsetParam) && offsetParam >= 0 ? offsetParam : 0;

  return { limit, offset };
}

export function paginate<T>(items: readonly T[], params: PaginationParams): PaginatedResult<T> {
  return {
    items: items.slice(params.offset, params.offset + params.limit),
    total: items.length,
  };
}
