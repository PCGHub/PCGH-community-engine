/**
 * Real Supabase client factory for tests/live/ only (EWP-008). Not a
 * mock -- constructs an actual @supabase/supabase-js client against
 * whatever real Postgres/Supabase Auth/PostgREST stack is currently
 * running (the local CLI stack today; the staging project once
 * EWP-009 exists).
 *
 * Deliberately reads TEST_SUPABASE_* variables, not the application's
 * own NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY names --
 * per the Founder/Chief Architect's explicit instruction: once a real
 * staging or production Supabase project exists, a developer's local
 * .env.local could plausibly point the app's own variables at it. If
 * this helper read those same names, running `npm run test:live`
 * could silently run destructive/test data against a real
 * environment. A distinct namespace makes that impossible by
 * construction, not by convention.
 *
 * Fails closed: throws immediately if required configuration is
 * missing, rather than falling back to any default, empty string, or
 * another environment variable. A live test must never run against
 * an unintended target.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. tests/live/ requires a real Supabase target -- ` +
        'see tests/live/README.md. Refusing to fall back to any other configuration.',
    );
  }
  return value;
}

/**
 * @supabase/supabase-js always constructs a RealtimeClient internally,
 * even though EWP-008's config.toml deliberately disables Realtime on
 * the server side (nothing in PCGH's approved architecture uses it) --
 * the client library still needs a WebSocket constructor to finish
 * initializing, and Node 20 (this project's pinned CI version,
 * .github/workflows/ci.yml) has no native one. Without this, every
 * createClient() call in tests/live/ throws before a single query
 * runs -- discovered running the EWP-008 smoke test against the real
 * local stack, not assumed. The `ws` package is test-only
 * infrastructure (a devDependency), not a runtime dependency of the
 * application itself, and does not enable or use Realtime -- it only
 * satisfies the client constructor's requirement.
 */
const REALTIME_OPTIONS = { realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket } };

export function createLiveAnonClient(): SupabaseClient {
  return createClient(requireEnv('TEST_SUPABASE_URL'), requireEnv('TEST_SUPABASE_ANON_KEY'), REALTIME_OPTIONS);
}

export function createLiveServiceClient(): SupabaseClient {
  return createClient(
    requireEnv('TEST_SUPABASE_URL'),
    requireEnv('TEST_SUPABASE_SERVICE_ROLE_KEY'),
    REALTIME_OPTIONS,
  );
}
