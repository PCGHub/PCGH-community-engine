/**
 * Verifies migration 012's advisory username-availability check
 * (api.is_username_available). Covers: taken/available semantics,
 * case-sensitive distinctness (matching identity.users.username's
 * real UNIQUE constraint exactly), defensive input handling, and the
 * individually-justified privilege model.
 *
 * Privilege assertions and how each is actually proven here:
 *   1. anon has USAGE on schema api -- proven functionally, not
 *      directly (tests/live/ has no raw Postgres connection to
 *      check has_function_privilege()/schema USAGE the way the SQL
 *      Editor did during EWP-009/010's staging verification): the
 *      "allows anon to call is_username_available" test below can
 *      only succeed if BOTH schema-level USAGE and the function's
 *      own EXECUTE grant are present -- Postgres's two-layer model
 *      means a missing USAGE grant fails with "permission denied
 *      for schema api" before the function-level grant is ever
 *      consulted (this exact failure mode is what was found and
 *      fixed before this file reached its current form).
 *   2. anon has EXECUTE on exactly is_username_available(text) --
 *      the same test.
 *   3. PUBLIC does not have unintended EXECUTE on this routine --
 *      proven functionally, by implication: assertions 4's two
 *      tests (authenticated/service_role denied) would BOTH have to
 *      succeed instead if PUBLIC still carried EXECUTE, since every
 *      role implicitly inherits PUBLIC's privileges regardless of
 *      its own explicit grants. Both roles being denied is only
 *      possible if PUBLIC's EXECUTE was genuinely revoked.
 *   4. authenticated and service_role do not receive explicit
 *      EXECUTE on this routine -- the two dedicated denial tests
 *      below.
 *   5. Existing protected api.* routines do not become callable by
 *      anon merely because schema USAGE was granted -- this is a
 *      full catalog enumeration across every api routine
 *      (has_function_privilege('anon', ...) for all 16 routines),
 *      which genuinely requires a raw Postgres connection this test
 *      suite doesn't have. Performed instead as a companion,
 *      read-only docker exec psql query against the same local
 *      disposable stack this suite runs against, immediately after
 *      the fresh migration 001-012 reset -- the same verification
 *      mechanism already established and accepted throughout
 *      EWP-009/010 for exactly this class of check. Full query and
 *      result recorded in the EWP-011 Gate 3 report, not duplicated
 *      here as an automated test.
 */

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { createLiveAnonClient, createLiveServiceClient } from '../helpers/live-supabase-client';

const REALTIME_OPTIONS = { realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket } };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

function createLiveAuthenticatedClient(accessToken: string) {
  return createClient(requireEnv('TEST_SUPABASE_URL'), requireEnv('TEST_SUPABASE_ANON_KEY'), {
    ...REALTIME_OPTIONS,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function cleanupIdentity(
  service: ReturnType<typeof createLiveServiceClient>,
  authUserId: string,
) {
  const { data: identityRow } = await service
    .schema('identity')
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (identityRow) {
    await service.schema('identity').from('user_roles').delete().eq('user_id', identityRow.id);
    await service.schema('identity').from('users').delete().eq('id', identityRow.id);
  }

  await service.auth.admin.deleteUser(authUserId);
}

describe('Migration 012: username availability check', () => {
  it('reports an existing exact-case username as unavailable, and a case-different username as available', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const takenUsername = `AvailCheck${suffix}`;
    const email = `ewp011-avail-${suffix}@example.test`;

    const { data: signUpData, error: signUpError } = await anon.auth.signUp({
      email,
      password: 'Ewp011TestPassword!23',
      options: { data: { username: takenUsername } },
    });
    expect(signUpError).toBeNull();
    const authUserId = signUpData.user!.id;

    // A fresh, genuinely-anonymous client for the actual availability
    // checks -- `anon` above now holds the just-created user's session
    // (auth.signUp() attaches it to the same client instance), so
    // reusing `anon` here would test `authenticated`, not `anon`.
    const trulyAnon = createLiveAnonClient();

    const { data: exactCaseAvailable, error: exactCaseError } = await trulyAnon
      .schema('api')
      .rpc('is_username_available', { p_username: takenUsername });
    expect(exactCaseError).toBeNull();
    expect(exactCaseAvailable).toBe(false);

    const differentCaseUsername = takenUsername.toLowerCase();
    const { data: differentCaseAvailable, error: differentCaseError } = await trulyAnon
      .schema('api')
      .rpc('is_username_available', { p_username: differentCaseUsername });
    expect(differentCaseError).toBeNull();
    expect(differentCaseAvailable).toBe(true);

    await cleanupIdentity(service, authUserId);
  });

  it('reports a genuinely unused username as available', async () => {
    const anon = createLiveAnonClient();
    const suffix = Date.now();

    const { data, error } = await anon
      .schema('api')
      .rpc('is_username_available', { p_username: `NeverUsed${suffix}` });

    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it('treats empty, whitespace-only, and overlength input as unavailable, never as an error', async () => {
    const anon = createLiveAnonClient();

    const { data: emptyResult, error: emptyError } = await anon
      .schema('api')
      .rpc('is_username_available', { p_username: '' });
    expect(emptyError).toBeNull();
    expect(emptyResult).toBe(false);

    const { data: whitespaceResult, error: whitespaceError } = await anon
      .schema('api')
      .rpc('is_username_available', { p_username: '   ' });
    expect(whitespaceError).toBeNull();
    expect(whitespaceResult).toBe(false);

    const { data: overlengthResult, error: overlengthError } = await anon
      .schema('api')
      .rpc('is_username_available', { p_username: 'x'.repeat(51) });
    expect(overlengthError).toBeNull();
    expect(overlengthResult).toBe(false);
  });

  it('allows anon to call is_username_available', async () => {
    const anon = createLiveAnonClient();

    const { error } = await anon.schema('api').rpc('is_username_available', { p_username: 'AnonAccessCheck' });

    expect(error).toBeNull();
  });

  it('does not allow an authenticated session to call is_username_available (no grant)', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const email = `ewp011-authcheck-${suffix}@example.test`;

    const { data: signUpData, error: signUpError } = await anon.auth.signUp({
      email,
      password: 'Ewp011TestPassword!23',
      options: { data: { username: `AuthCheck${suffix}` } },
    });
    expect(signUpError).toBeNull();
    const authUserId = signUpData.user!.id;
    const accessToken = signUpData.session?.access_token;
    expect(accessToken).toBeDefined();

    const authenticatedClient = createLiveAuthenticatedClient(accessToken!);
    const { error: rpcError } = await authenticatedClient
      .schema('api')
      .rpc('is_username_available', { p_username: 'SomeCandidateName' });

    expect(rpcError).not.toBeNull();

    await cleanupIdentity(service, authUserId);
  });

  it('does not allow service_role to call is_username_available (no grant)', async () => {
    const service = createLiveServiceClient();

    const { error } = await service
      .schema('api')
      .rpc('is_username_available', { p_username: 'SomeCandidateName' });

    expect(error).not.toBeNull();
  });

  it('still allows a real signup to succeed or collide correctly even without calling the advisory check first', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const username = `NoAdvisoryCheck${suffix}`;
    const emailA = `ewp011-noadvisory-a-${suffix}@example.test`;
    const emailB = `ewp011-noadvisory-b-${suffix}@example.test`;

    const { data: signUpA, error: errorA } = await anon.auth.signUp({
      email: emailA,
      password: 'Ewp011TestPassword!23',
      options: { data: { username } },
    });
    expect(errorA).toBeNull();
    const authUserIdA = signUpA.user!.id;

    const { error: errorB } = await anon.auth.signUp({
      email: emailB,
      password: 'Ewp011TestPassword!23',
      options: { data: { username } },
    });
    expect(errorB).not.toBeNull();

    await cleanupIdentity(service, authUserIdA);
  });
});
