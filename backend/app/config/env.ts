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
 * Validates an already-extracted public value. Deliberately does NOT
 * take the variable name and look it up dynamically
 * (process.env[name]) -- Next.js's build-time client-bundle inlining
 * only recognizes static, literal `process.env.NEXT_PUBLIC_X`
 * references (https://nextjs.org/docs/14/app/building-your-application/configuring/environment-variables).
 * A dynamic lookup is never inlined and silently resolves to
 * undefined in the browser, regardless of what's configured in the
 * hosting provider. Every NEXT_PUBLIC_ reference in getPublicEnv()
 * below must therefore be written out literally at its call site --
 * do not "simplify" this back into a loop or a shared dynamic
 * accessor like requireEnv(name) above.
 */
function requirePublicValue(name: string, value: string | undefined): string {
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
    supabaseUrl: requirePublicValue('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: requirePublicValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
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
