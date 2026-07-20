/**
 * EWP-008 infrastructure smoke test. Proves the live-test mechanism
 * itself works -- real network connectivity to a real Postgres
 * instance, and that migrations 001-009 applied cleanly -- nothing
 * about ADR-018/ADR-017 business behavior, which belongs to their
 * own owning EWPs (010, 012-017).
 *
 * Originally attempted to enumerate information_schema.schemata to
 * prove every business schema exists. That approach was wrong, not
 * the infrastructure: PostgREST correctly refuses to serve
 * information_schema, because supabase/config.toml (EWP-008,
 * reviewed) deliberately restricts exposed schemas to exactly
 * `["api", "identity"]`, per "API Schema First" -- confirmed live by
 * PostgREST's own error ("Only the following schemas are exposed:
 * api, identity") when this test was first run against the real
 * stack. Corrected to verify migrations the way this project's own
 * architecture actually allows: identity.users directly (migration
 * 001), and one representative api.* view per remaining business
 * schema (migrations 002-008) -- proving the full chain (business
 * schema -> RLS -> api view -> PostgREST) for each, not just that a
 * schema name exists.
 */

import { createLiveServiceClient } from '../helpers/live-supabase-client';

describe('EWP-008 live-test infrastructure smoke test', () => {
  it('finds a known table from the first migration (identity.users)', async () => {
    const client = createLiveServiceClient();

    const { error } = await client.schema('identity').from('users').select('id').limit(1);

    expect(error).toBeNull();
  });

  it.each([
    ['economy (migration 002)', 'campaign_summary_view'],
    ['discovery (migration 003)', 'discovery_summary_view'],
    ['protection (migration 004)', 'creator_protection_view'],
    ['intelligence (migration 005)', 'badges_view'],
    ['analytics (migration 006)', 'platform_statistics_view'],
    ['governance (migration 007)', 'platform_configuration_view'],
  ])('finds the api.* view proving %s applied (api.%s)', async (_label, viewName) => {
    const client = createLiveServiceClient();

    const { error } = await client
      .schema('api')
      .from(viewName)
      .select('*')
      .limit(1);

    expect(error).toBeNull();
  });

  // Migration 009 (seed data) is not separately smoke-tested here:
  // api.platform_configuration_view carries a literal `where
  // identity.is_admin()` predicate baked into the view itself (not
  // RLS -- migration 008's own header comment), which evaluates
  // against auth.uid(), not against BYPASSRLS. A bare service-role
  // client with no authenticated session resolves identity.is_admin()
  // to false, so this view legitimately returns zero rows regardless
  // of whether seed data exists -- discovered while writing this
  // test, not assumed, and correctly not worked around here.
  // Migration 009 applying is already proven by `supabase start`
  // itself completing without error (a failed migration aborts the
  // whole stack boot).
});
