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
 * Status as of Phase 5 completion: no API route/controller layer
 * (`app/api/`) was built during Phase 5 -- no roadmap step required
 * one (verified against all 15 steps' Deliverables/Exit Criteria).
 * Every roadmap step routed data access through Server Components
 * calling domain services directly instead (see
 * app/config/supabase-server.ts's cookie-based session reading, which
 * the dashboards actually use). This function, session.ts, and
 * roles.ts are intentional, tested, working infrastructure prepared
 * for whenever a Controller layer is actually built -- not dead code,
 * not technical debt, just correctly idle until that layer exists.
 * See docs/technical-debt.md's "Reclassified" entry for the full
 * evidence-based determination.
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
