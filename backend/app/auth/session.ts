/**
 * Session resolver, per docs/authentication-architecture.md's
 * "Authentication Components": validates the incoming Supabase session
 * server-side (Supabase's own verification, not a local JWT decode) and
 * resolves identity.current_user_id().
 *
 * Calls identity.current_user_id() directly rather than reimplementing
 * an equivalent lookup -- this matches the architecture document's
 * "Dependencies" section, which names identity.current_user_id() (001)
 * as a direct dependency of this resolver.
 *
 * Note: this assumes the `identity` schema (like `api`) is exposed via
 * the Supabase project's Data API schema configuration -- a deployment
 * prerequisite for the whole backend, not something introduced here.
 */

import { createSupabaseClient } from '../config/supabase';

export interface ResolvedSession {
  readonly authUserId: string;
  readonly userId: string;
  readonly accessToken: string;
}

/**
 * Returns null on any invalid/expired/unverifiable session -- callers
 * must treat null as "not authenticated" and fail closed, per the
 * architecture's Security Principles ("Failed authentication fails
 * closed").
 */
export async function resolveSession(accessToken: string): Promise<ResolvedSession | null> {
  const client = createSupabaseClient(accessToken);

  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return null;
  }

  const { data: userId, error: rpcError } = await client.schema('identity').rpc('current_user_id');
  if (rpcError || !userId) {
    return null;
  }

  return {
    authUserId: userData.user.id,
    userId,
    accessToken,
  };
}
