/**
 * Verifies migration 011's ADR-018 provisioning trigger
 * (identity.handle_new_auth_user()). Covers the happy path, the two
 * fail-atomically cases (missing username, username collision), and
 * the role-escalation-prevention invariant.
 *
 * Not covered here: the mismatched-pre-existing-row idempotency
 * branch cannot be exercised through the public Auth API surface
 * without either forcing a second auth.users INSERT for the same id
 * (not achievable via signUp()/admin.createUser()) or weakening this
 * function's zero-EXECUTE-grant design solely to make it directly
 * callable for a test -- neither is done. That branch is verified by
 * direct code review of the IF/RAISE EXCEPTION logic in the
 * migration, not by an automated live test that would otherwise only
 * be testing itself.
 *
 * The collision test is deliberately self-contained (two throwaway
 * signups created and compared against each other) rather than
 * depending on the staging-only pcgh_admin bootstrap identity, so
 * this suite runs identically on local disposable Supabase, CI, and
 * staging.
 */

import { createLiveAnonClient, createLiveServiceClient } from '../helpers/live-supabase-client';

const TEST_PASSWORD = 'Ewp010TestPassword!23';

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

describe('Migration 011: automatic identity provisioning (ADR-018)', () => {
  it('provisions identity.users and identity.user_roles on a real signup', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const email = `ewp010-signup-${suffix}@example.test`;
    const username = `ewp010user${suffix}`;

    const { data: signUpData, error: signUpError } = await anon.auth.signUp({
      email,
      password: TEST_PASSWORD,
      options: { data: { username } },
    });

    expect(signUpError).toBeNull();
    const authUserId = signUpData.user!.id;

    const { data: identityRow, error: identityError } = await service
      .schema('identity')
      .from('users')
      .select('id, email, username, user_code, email_verified')
      .eq('auth_user_id', authUserId)
      .single();

    expect(identityError).toBeNull();
    expect(identityRow!.email).toBe(email);
    expect(identityRow!.username).toBe(username);
    expect(identityRow!.user_code).toMatch(/^USR-[0-9A-F]{16}$/);

    const { data: roleRows, error: roleError } = await service
      .schema('identity')
      .from('user_roles')
      .select('role_name')
      .eq('user_id', identityRow!.id);

    expect(roleError).toBeNull();
    expect(roleRows).toHaveLength(1);
    expect(roleRows?.[0]?.role_name).toBe('member');

    await cleanupIdentity(service, authUserId);
  });

  it('fails a second signup atomically on a username collision with a first signup', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const sharedUsername = `ewp010collide${suffix}`;
    const emailA = `ewp010-collide-a-${suffix}@example.test`;
    const emailB = `ewp010-collide-b-${suffix}@example.test`;

    const { data: signUpA, error: errorA } = await anon.auth.signUp({
      email: emailA,
      password: TEST_PASSWORD,
      options: { data: { username: sharedUsername } },
    });
    expect(errorA).toBeNull();
    const authUserIdA = signUpA.user!.id;

    const { data: identityA, error: identityAError } = await service
      .schema('identity')
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserIdA)
      .single();
    expect(identityAError).toBeNull();
    expect(identityA).not.toBeNull();

    const { error: errorB } = await anon.auth.signUp({
      email: emailB,
      password: TEST_PASSWORD,
      options: { data: { username: sharedUsername } },
    });
    expect(errorB).not.toBeNull();

    const { data: listData } = await service.auth.admin.listUsers();
    expect(listData.users.some((u) => u.email === emailB)).toBe(false);

    const { data: identityBRows } = await service
      .schema('identity')
      .from('users')
      .select('id')
      .eq('email', emailB);
    expect(identityBRows).toHaveLength(0);

    await cleanupIdentity(service, authUserIdA);
  });

  it('fails the signup atomically when no username is supplied', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const email = `ewp010-nousername-${suffix}@example.test`;

    const { error: signUpError } = await anon.auth.signUp({
      email,
      password: TEST_PASSWORD,
    });

    expect(signUpError).not.toBeNull();

    const { data: listData } = await service.auth.admin.listUsers();
    expect(listData.users.some((u) => u.email === email)).toBe(false);
  });

  it('ignores a client-supplied role-override attempt, always provisioning member', async () => {
    const anon = createLiveAnonClient();
    const service = createLiveServiceClient();
    const suffix = Date.now();
    const email = `ewp010-roleattempt-${suffix}@example.test`;
    const username = `ewp010role${suffix}`;

    const { data: signUpData, error: signUpError } = await anon.auth.signUp({
      email,
      password: TEST_PASSWORD,
      options: { data: { username, role: 'admin' } },
    });

    expect(signUpError).toBeNull();
    const authUserId = signUpData.user!.id;

    const { data: identityRow } = await service
      .schema('identity')
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    const { data: roleRows } = await service
      .schema('identity')
      .from('user_roles')
      .select('role_name')
      .eq('user_id', identityRow!.id);

    expect(roleRows).toHaveLength(1);
    expect(roleRows?.[0]?.role_name).toBe('member');

    await cleanupIdentity(service, authUserId);
  });
});
