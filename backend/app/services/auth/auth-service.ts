/**
 * Browser-facing signup/login/username-availability operations
 * (EWP-011). Distinct from app/auth/'s server-side, Bearer-token
 * Authentication Service (session.ts/roles.ts/middleware.ts) -- this
 * file is called directly from Client Components using the browser
 * Supabase client (config/supabase-browser.ts), never from the API
 * route layer.
 *
 * Plain functions, no React import -- callable identically from
 * jsdom component tests (mocked) and tests/live/ (real disposable
 * Supabase, plain Node environment), per the approved EWP-011 test
 * strategy: the UI owns debounce/presentation, this module owns the
 * Supabase call and narrow result mapping.
 */

import type { SupabaseClient, AuthError } from '@supabase/supabase-js';

export type SignupOutcome =
  | { status: 'signed_in' }
  | { status: 'confirmation_required' }
  | { status: 'error'; message: string };

export type LoginOutcome =
  | { status: 'signed_in' }
  | { status: 'error'; message: string };

/**
 * 'unknown' means the advisory service has no result -- never
 * checked yet, locally-invalid input, or a network/RPC failure. It
 * is NEVER equivalent to 'taken' and must never be rendered as such;
 * final username uniqueness is governed solely by
 * identity.users.username's database UNIQUE constraint.
 */
export type UsernameAvailability = 'available' | 'taken' | 'unknown';

export function isValidUsernameShape(username: string): boolean {
  const trimmed = username.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}

export async function performSignup(
  client: SupabaseClient,
  params: { email: string; password: string; username: string },
): Promise<SignupOutcome> {
  if (!isValidUsernameShape(params.username)) {
    // Local validation catches this before
    // identity.handle_new_auth_user()'s own exception ever needs to
    // -- the trigger's own check remains a backstop, not the primary
    // signal.
    return { status: 'error', message: 'Please enter a username.' };
  }

  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { username: params.username } },
  });

  if (error) {
    return { status: 'error', message: mapAuthError(error) };
  }
  if (data.session) {
    return { status: 'signed_in' };
  }
  return { status: 'confirmation_required' };
}

export async function performLogin(
  client: SupabaseClient,
  params: { email: string; password: string },
): Promise<LoginOutcome> {
  const { data, error } = await client.auth.signInWithPassword(params);

  if (error) {
    return { status: 'error', message: mapAuthError(error) };
  }
  if (data.session) {
    return { status: 'signed_in' };
  }
  return { status: 'error', message: 'Something went wrong. Please try again.' };
}

export async function checkUsernameAvailability(
  client: SupabaseClient,
  username: string,
): Promise<UsernameAvailability> {
  if (!isValidUsernameShape(username)) {
    return 'unknown'; // locally-invalid input never reaches the RPC at all
  }

  const { data, error } = await client
    .schema('api')
    .rpc('is_username_available', { p_username: username });

  if (error) {
    // Network/RPC failure -- NEVER interpreted as "taken." The
    // advisory check simply has no opinion; final signup remains
    // governed solely by the database UNIQUE constraint.
    return 'unknown';
  }
  return data ? 'available' : 'taken';
}

function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with that email already exists.';
    case 'weak_password':
      return 'Please choose a stronger password.';
    case 'email_address_invalid':
      return 'Please enter a valid email address.';
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      break;
  }

  // No structured GoTrue code matched -- most likely
  // identity.handle_new_auth_user()'s own custom RAISE EXCEPTION
  // (missing/colliding username), which surfaces without one of
  // GoTrue's own known codes. Controlled substring matching ONLY for
  // this one known, narrow case -- never a raw-text passthrough.
  if (error.message.toLowerCase().includes('username')) {
    return 'That username is already taken or invalid. Please choose another.';
  }

  return 'Something went wrong. Please try again.';
}
