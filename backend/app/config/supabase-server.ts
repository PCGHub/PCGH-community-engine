/**
 * Server Component session reader, per
 * docs/authentication-architecture.md's "Session Management": "The
 * frontend holds the Supabase session client-side... per Supabase's
 * standard Next.js integration pattern." @supabase/ssr is that
 * standard pattern's cookie-reading mechanism for the App Router.
 *
 * Used only by Server Components (the Phase 5 Step 13 dashboard
 * pages), which never ship their implementation to the browser --
 * this file is not, and must not become, reachable from a 'use client'
 * component. Uses the anon key only; RLS applies exactly as it does
 * for any other authenticated request. Never references service_role.
 *
 * Server Components cannot set cookies (only Route Handlers/Server
 * Actions can) -- set/remove are no-ops here, which only affects
 * session *refresh*, not reading the current session for a render.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicEnv } from './env';

export function createSupabaseServerComponentClient() {
  const cookieStore = cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // Server Components cannot set cookies; session refresh is out
        // of scope for Step 13's read-only dashboards.
      },
      remove() {
        // See set() above.
      },
    },
  });
}

/**
 * Returns the current session's access token, or null if there is no
 * session. Callers must render an unauthenticated/empty state on
 * null, never a workaround.
 */
export async function getServerComponentAccessToken(): Promise<string | null> {
  const client = createSupabaseServerComponentClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  return session?.access_token ?? null;
}
