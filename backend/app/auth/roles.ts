/**
 * Role resolver, per docs/authentication-architecture.md's "Role
 * Resolution": identity.user_roles is the single source of truth for
 * member/creator/admin roles, and a user may hold more than one role
 * simultaneously -- this must never be flattened into a single-role
 * assumption.
 *
 * Reads live from the database on every call (via identity.is_admin()
 * and identity.user_roles, both RLS-governed) -- never from JWT claims
 * or a cache, per "Permission Resolution": there is no application-layer
 * permission list to keep in sync with the database.
 */

import { createSupabaseClient } from '../config/supabase';

export type Role = 'member' | 'creator' | 'admin';

export interface ResolvedRoles {
  readonly roles: readonly Role[];
  readonly isAdmin: boolean;
}

export async function resolveRoles(accessToken: string, userId: string): Promise<ResolvedRoles> {
  const client = createSupabaseClient(accessToken);

  const [rolesResult, adminResult] = await Promise.all([
    client.schema('identity').from('user_roles').select('role_name').eq('user_id', userId),
    client.schema('identity').rpc('is_admin'),
  ]);

  if (rolesResult.error || adminResult.error) {
    throw new Error('Role resolution failed');
  }

  return {
    roles: (rolesResult.data ?? []).map((row) => row.role_name as Role),
    isAdmin: Boolean(adminResult.data),
  };
}
