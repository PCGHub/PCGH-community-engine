/**
 * Shared mocked Supabase client builder for Phase 5 Step 14 tests.
 *
 * No live Supabase project exists in this environment, so these tests
 * cannot be true database integration tests. Instead they mock the
 * PostgREST query builder at the module boundary
 * (config/supabase.ts's createSupabaseClient/createSupabaseServiceClient)
 * and assert on: (a) which schema/table/rpc a service calls, and (b)
 * whether the service correctly maps a raw row into its domain type,
 * or handles a null/error response. This exercises real, executed code
 * paths (not just type-checking), per
 * docs/implementation-playbook.md's Definition of Done ("exercised
 * end-to-end, not just type-checked") -- within the honest limits of
 * having no live database to hit.
 *
 * Three independent response channels, since a single service call can
 * use more than one (e.g. roles.ts's resolveRoles() calls both a
 * .from().select() query and a .rpc() in the same request):
 *   - query: response for .from(...).select(...)... chains
 *            (terminated by .maybeSingle() or awaited directly)
 *   - rpc: response for .rpc(...) calls
 *   - authGetUser / authGetSession: response for the two auth.* calls
 */

export interface MockResult {
  data?: unknown;
  error?: { message: string } | null;
}

export interface MockClientConfig {
  query?: MockResult;
  rpc?: MockResult;
  authGetUser?: { data?: { user: unknown } | { user: null }; error?: { message: string } | null };
  authGetSession?: { data: { session: unknown }; error?: unknown };
}

export function createMockSupabaseClient(config: MockClientConfig = {}) {
  const queryResponse = { data: config.query?.data ?? null, error: config.query?.error ?? null };
  const rpcResponse = { data: config.rpc?.data ?? null, error: config.rpc?.error ?? null };
  const getUserResponse = config.authGetUser ?? { data: { user: null }, error: null };
  const getSessionResponse = config.authGetSession ?? { data: { session: null }, error: null };

  const client: any = {
    schema: jest.fn(() => client),
    from: jest.fn(() => client),
    select: jest.fn(() => client),
    eq: jest.fn(() => client),
    gt: jest.fn(() => client),
    order: jest.fn(() => client),
    returns: jest.fn(() => client),
    maybeSingle: jest.fn(() => Promise.resolve(queryResponse)),
    rpc: jest.fn(() => ({ then: (resolve: (v: MockResult) => void) => resolve(rpcResponse) })),
    then: (resolve: (v: MockResult) => void) => resolve(queryResponse),
    auth: {
      getUser: jest.fn(() => Promise.resolve(getUserResponse)),
      getSession: jest.fn(() => Promise.resolve(getSessionResponse)),
    },
  };

  return client;
}
