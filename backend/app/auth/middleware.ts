/**
 * Auth middleware entry point, per docs/authentication-architecture.md's
 * "Authentication Components": the single place an incoming request's
 * session and roles are resolved before reaching a controller.
 *
 * Implemented as an explicit function a controller calls, rather than a
 * Next.js root `middleware.ts` -- per docs/backend-architecture.md's
 * "Thin API Layer" principle, authentication is a controller
 * responsibility (request validation, authentication, authorization,
 * calling services, formatting responses), so controllers invoke this
 * helper directly. No controllers exist yet (later Phase 5 steps); this
 * is the shared entry point they will call.
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
