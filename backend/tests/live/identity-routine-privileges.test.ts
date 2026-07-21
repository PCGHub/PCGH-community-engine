/**
 * Verifies migration 010's routine-EXECUTE remediation on identity's
 * three routines (identity.current_user_id, identity.is_admin,
 * identity.set_updated_at). Discovered during EWP-009 staging
 * verification: migration 001 never explicitly granted/revoked EXECUTE
 * on these, leaving Postgres's implicit PUBLIC-EXECUTE default in
 * effect -- unlike api's 15 routines (008_create_api_schema.sql),
 * which all carry an explicit ACL excluding anon.
 *
 * Scope note: this suite verifies GRANT-level behavior only (whether a
 * call is permitted at all), not ADR-018/EWP-010's identity-provisioning
 * business logic (what identity.users row a session resolves to) --
 * that remains EWP-010's own territory and is intentionally not built
 * or tested here. The authoritative check that `authenticated` itself
 * retains EXECUTE is the has_function_privilege()/proacl SQL re-run
 * mandated separately as part of this migration's post-apply
 * verification (not simulated via a throwaway signed-up session in
 * this suite, which would mean building signup/session test
 * machinery ahead of EWP-010/EWP-011).
 */

import { createLiveAnonClient, createLiveServiceClient } from '../helpers/live-supabase-client';

describe('Migration 010: identity routine EXECUTE privileges', () => {
  it('rejects an anonymous RPC call to identity.is_admin', async () => {
    const client = createLiveAnonClient();

    const { error } = await client.schema('identity').rpc('is_admin');

    expect(error).not.toBeNull();
  });

  it('rejects an anonymous RPC call to identity.current_user_id', async () => {
    const client = createLiveAnonClient();

    const { error } = await client.schema('identity').rpc('current_user_id');

    expect(error).not.toBeNull();
  });

  it('still allows service_role to call is_admin/current_user_id (explicit grant intact)', async () => {
    const client = createLiveServiceClient();

    const { error: isAdminError } = await client.schema('identity').rpc('is_admin');
    const { error: currentUserIdError } = await client.schema('identity').rpc('current_user_id');

    expect(isAdminError).toBeNull();
    expect(currentUserIdError).toBeNull();
  });

  it('still fires identity.set_updated_at on an UPDATE (trigger semantics unaffected by the privilege change)', async () => {
    const client = createLiveServiceClient();
    const suffix = Date.now();

    const { data: inserted, error: insertError } = await client
      .schema('identity')
      .from('users')
      .insert({
        user_code: `M010T${suffix}`,
        email: `migration-010-trigger-test-${suffix}@example.test`,
        username: `m010trigger${suffix}`,
      })
      .select('id, updated_at')
      .single();

    expect(insertError).toBeNull();

    const { data: updated, error: updateError } = await client
      .schema('identity')
      .from('users')
      .update({ full_name: 'Migration 010 Trigger Test' })
      .eq('id', inserted!.id)
      .select('updated_at')
      .single();

    expect(updateError).toBeNull();
    expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(
      new Date(inserted!.updated_at).getTime(),
    );

    await client.schema('identity').from('users').delete().eq('id', inserted!.id);
  });
});
