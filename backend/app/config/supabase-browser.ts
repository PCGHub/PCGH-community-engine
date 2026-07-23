/**
 * Browser-side Supabase client (EWP-011). Uses @supabase/ssr's
 * createBrowserClient rather than a bare @supabase/supabase-js
 * createClient() specifically so the session persists in cookies
 * using the same convention config/supabase-server.ts's
 * getServerComponentAccessToken() already reads.
 *
 * Confirmed against the installed @supabase/ssr@0.5.2:
 * createBrowserClient's cookie option is optional and auto-manages
 * document.cookie when omitted -- no custom cookie implementation is
 * needed here (unlike createServerClient, which requires explicit
 * next/headers wiring and is REQUIRED, not optional, for that
 * reason).
 *
 * A module-level singleton, per @supabase/ssr's own recommended
 * pattern, to avoid constructing multiple GoTrue instances competing
 * over the same cookie storage.
 *
 * Uses only the anon key (getPublicEnv()) -- never getServerEnv() /
 * service_role. This file is reachable from 'use client' components.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';

let client: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
