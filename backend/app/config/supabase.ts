/**
 * Shared Supabase client factory, per docs/backend-architecture.md's
 * Folder Structure ("Supabase client wrapper (shared by every service)")
 * and Phase 5 Step 2 (Core Infrastructure).
 *
 * Two distinct clients, matching docs/authentication-architecture.md's
 * "Authorization Model":
 *   - createSupabaseClient(): scoped to the calling user's session. Row
 *     Level Security applies exactly as already enforced in migrations
 *     001-009. This is the default for every domain service.
 *   - createSupabaseServiceClient(): uses service_role, which bypasses
 *     RLS entirely. Server-side only. Never call this from code that can
 *     execute in the browser.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv, getServerEnv } from './env';

export function createSupabaseClient(accessToken?: string): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

/**
 * service_role client. Bypasses Row Level Security entirely.
 *
 * Reserved for trusted backend automation (scheduled jobs, internal
 * service-to-service calls) -- the same trust boundary already
 * established by the `auth.uid() is null` checks throughout
 * 008_create_api_schema.sql. Do not import this module from any file
 * that can be bundled into client-side code.
 */
export function createSupabaseServiceClient(): SupabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
