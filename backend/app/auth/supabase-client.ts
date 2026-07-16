/**
 * Thin Supabase Auth wrapper, per docs/authentication-architecture.md's
 * "Supabase Authentication" section: PCGH does not implement its own
 * credential storage, password hashing, or session-signing logic. Every
 * function here is a direct passthrough to the Supabase Auth SDK.
 *
 * Uses the anon-key client (config/supabase.ts's createSupabaseClient),
 * never the service_role client -- these are user-initiated auth
 * operations, not trusted backend automation.
 */

import { createSupabaseClient } from '../config/supabase';

export async function signUpWithPassword(email: string, password: string) {
  return createSupabaseClient().auth.signUp({ email, password });
}

export async function signInWithPassword(email: string, password: string) {
  return createSupabaseClient().auth.signInWithPassword({ email, password });
}

export async function signOut(accessToken: string) {
  return createSupabaseClient(accessToken).auth.signOut();
}

export async function refreshSession(refreshToken: string) {
  return createSupabaseClient().auth.refreshSession({ refresh_token: refreshToken });
}
