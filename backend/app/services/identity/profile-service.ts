/**
 * Identity Domain Service, per Phase 5 Step 4's deliverable: reads the
 * profile fields of api.creator_dashboard_view and
 * api.member_dashboard_view. Per the "API Schema First" principle
 * (docs/backend-architecture.md), this queries the api schema only --
 * never identity.* tables directly.
 *
 * Both views are `security_invoker = true` (008_create_api_schema.sql),
 * so the underlying identity.users RLS policy (owner-or-admin) already
 * scopes results to the caller -- this service adds no authorization
 * logic of its own.
 *
 * Read-only: Step 4's Deliverables list profile *reads* from these two
 * views only. No api schema function/updatable view exists yet for
 * writing identity.users profile fields (username, full_name,
 * avatar_url) -- adding one is a new migration decision, not something
 * this step invents. See docs/technical-debt.md if a profile-update
 * flow is needed.
 */

import { createSupabaseClient } from '../../config/supabase';
import type { UserProfile } from '../../domains/identity/profile';

interface ProfileRow {
  user_id: string;
  user_code: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
}

function toUserProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    userCode: row.user_code,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    status: row.status as UserProfile['status'],
  };
}

export async function getCreatorProfile(accessToken: string, userId: string): Promise<UserProfile | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('creator_dashboard_view')
    .select('user_id, user_code, username, full_name, avatar_url, status')
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>();

  if (error || !data) {
    return null;
  }

  return toUserProfile(data);
}

export async function getMemberProfile(accessToken: string, userId: string): Promise<UserProfile | null> {
  const client = createSupabaseClient(accessToken);
  const { data, error } = await client
    .schema('api')
    .from('member_dashboard_view')
    .select('user_id, user_code, username, full_name, avatar_url, status')
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>();

  if (error || !data) {
    return null;
  }

  return toUserProfile(data);
}
