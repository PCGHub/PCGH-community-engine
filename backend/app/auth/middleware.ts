/**
 * Auth middleware entry point, per docs/authentication-architecture.md's
 * "Authentication Components": the single place an incoming request's
 * session and roles are resolved before reaching a controller.
 *
 * Implemented as an explicit function a controller calls, rather than a
 * Next.js root `middleware.ts` -- per docs/backend-architecture.md's
 * "Thin API Layer" principle, authentication is a controller
 * responsibility, so controllers invoke this helper directly.
 *
 * Status as of Phase 6 EWP-001: this function is now the Controller
 * layer's authentication entry point, called from
 * app/api/_lib/handler.ts's withAuth() wrapper for every v1 route,
 * exactly as anticipated when it was built in Phase 5 Step 3 and left
 * unconsumed through the rest of Phase 5 (see docs/technical-debt.md's
 * "Reclassified" entry for the evidence-based determination that this
 * was intentional, not dead code). The dashboards continue to use
 * app/config/supabase-server.ts's cookie-based session reading
 * instead -- the two mechanisms serve two different callers (a
 * browser rendering a page vs. an HTTP client calling the API), per
 * docs/api-specification.md Section 4.
 *
 * Contains no business logic: it only resolves identity and roles and
 * fails closed. Authorization decisions beyond that remain with RLS.
 */

import { resolveRoles, type ResolvedRoles } from './roles';
import { resolveSession, type ResolvedSession } from './session';

export interface AuthContext {
  readonly session: ResolvedSession;
  readonly roles: ResolvedRoles;
}

/**
 * Resolves the authenticated context for an incoming request, or null if
 * the request is unauthenticated/the session is invalid. Callers must
 * fail closed on null, per the architecture's Security Principles.
 */
export async function authenticate(request: Request): Promise<AuthContext | null> {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return null;
  }

  const session = await resolveSession(accessToken);
  if (!session) {
    return null;
  }

  const roles = await resolveRoles(accessToken, session.userId);

  return { session, roles };
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.slice('Bearer '.length);
}
