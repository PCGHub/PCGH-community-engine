-- =============================================================================
-- Migration: 010_secure_identity_routine_execute.sql
--
-- Purpose:
--   Closes an undocumented implicit PUBLIC EXECUTE grant on three
--   identity-schema routines, discovered during EWP-009 (Phase 7)
--   staging live-verification. Brings identity's routine-level
--   privilege posture in line with the explicit, deliberate grant
--   already established for the api schema (008_create_api_schema.sql).
--
-- Responsibilities:
--   - Revoke the implicit PUBLIC EXECUTE grant (Postgres's default for
--     newly created functions, never previously revoked here) from:
--       identity.current_user_id()
--       identity.is_admin()
--       identity.set_updated_at()
--   - Explicitly (re-)grant EXECUTE on all three to authenticated and
--     service_role only -- preserving every existing, legitimate
--     caller's access exactly as it already effectively was.
--
-- Relationships:
--   Depends on 001_create_identity_schema.sql (defines all three
--   functions). Does not modify 001 -- forward-only, per DSR-003.
--   Unrelated to ADR-018's planned identity.handle_new_auth_user()
--   (a new function, not touched here) -- no ordering dependency.
--
-- Notes:
--   - Discovered via EWP-009's live routine-privilege verification
--     (has_function_privilege() against the real staging project),
--     not assumed: identity.current_user_id(), identity.is_admin(),
--     and identity.set_updated_at() all showed proacl = NULL
--     (Postgres's "still at the default" marker) and anon_execute =
--     true, confirming the implicit PUBLIC grant was live -- unlike
--     api's 15 routines, which all carry an explicit ACL excluding
--     anon (008_create_api_schema.sql).
--   - authenticated MUST retain EXECUTE on identity.current_user_id()
--     and identity.is_admin(): both are referenced inside RLS policy
--     definitions across all eight schema migrations (001-008), and
--     backend/app/auth/session.ts / roles.ts call them directly as
--     part of the existing, shipped Authentication Service
--     (docs/technical-debt.md TD-001). Omitting the explicit re-grant
--     below would break RLS policy evaluation platform-wide, not
--     merely identity's own tables.
--   - identity.set_updated_at() is confirmed trigger-only: a direct
--     repository-wide grep found zero application-code references to
--     it outside its three `create trigger ... execute function
--     identity.set_updated_at()` bindings in 001. Revoking PUBLIC
--     EXECUTE does not affect trigger firing -- a trigger fires as
--     part of the triggering DML statement's own execution, gated by
--     the firing role's privilege on the table (UPDATE), not by that
--     role's EXECUTE privilege on the trigger function itself.
--   - No behavior change for any current legitimate caller: anon was
--     never an intended caller of any of the three functions.
--
-- Future expansion:
--   - None anticipated. Future identity-schema functions (e.g.
--     ADR-018's handle_new_auth_user()) should be written with an
--     explicit grant from the start, avoiding this kind of
--     remediation recurring.
--
-- Source of truth: EWP-009 (Phase 7) staging live-verification
-- findings; Founder/Chief-Architect-approved remediation, 2026-07-21.
-- =============================================================================

revoke execute on function identity.current_user_id() from public;
revoke execute on function identity.is_admin() from public;
revoke execute on function identity.set_updated_at() from public;

grant execute on function identity.current_user_id() to authenticated, service_role;
grant execute on function identity.is_admin() to authenticated, service_role;
grant execute on function identity.set_updated_at() to authenticated, service_role;
