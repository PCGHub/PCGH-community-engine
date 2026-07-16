/**
 * Typed environment configuration.
 *
 * Purpose: fail fast and explicitly if a required variable is missing,
 * rather than letting `undefined` propagate silently into a Supabase
 * client or elsewhere. This module validates presence and shape only —
 * no business logic.
 *
 * Security boundary (docs/authentication-architecture.md,
 * "Security Principles"): `serviceRoleKey` must only be read from
 * `getServerEnv()`, which is not safe to call from client-side code.
 * `getPublicEnv()` exposes only values already safe for the browser.
 */

export interface PublicEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface ServerEnv extends PublicEnv {
  supabaseServiceRoleKey: string;
  aiServiceUrl: string | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Values safe to use in client-reachable code.
 */
export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

/**
 * Values that must never be referenced from client-reachable code.
 * Callers are responsible for only invoking this from server-side
 * modules (API routes, server actions, background jobs).
 */
export function getServerEnv(): ServerEnv {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    aiServiceUrl: process.env.AI_SERVICE_URL,
  };
}
