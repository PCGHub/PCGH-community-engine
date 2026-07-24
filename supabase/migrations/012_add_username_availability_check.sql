-- =============================================================================
-- Migration: 012_add_username_availability_check.sql
--
-- Purpose:
--   Implements EWP-011's approved advisory username-availability check
--   (docs/phase-7-charter.md: "a client-side username-availability
--   check, explicitly advisory only"; ADR-018's "Username authority
--   rule"). This is PCGH's first anon-facing database capability --
--   reviewed and approved as a deliberate, narrow trust-boundary
--   exception, not a routine extension of an existing pattern.
--
-- Responsibilities:
--   - api.is_username_available(p_username text) returns boolean --
--     the ONLY thing this function does. Advisory only: the real,
--     final authority on username uniqueness remains
--     identity.users.username's UNIQUE NOT NULL constraint and
--     identity.handle_new_auth_user()'s own collision handling
--     (011_provision_identity_from_auth_signup.sql) -- this function
--     changes nothing about that enforcement and cannot be relied
--     upon to prevent a race between two simultaneous signups.
--
-- Relationships:
--   Reads identity.users (001_create_identity_schema.sql) only.
--   Does not modify migrations 001-011 -- forward-only, per DSR-003.
--
-- Notes:
--   - Case sensitivity: exact, untransformed equality against
--     identity.users.username. identity.users.username is a plain
--     varchar(50) with NO citext type, NO lower() functional index,
--     and NO case-related CHECK constraint anywhere in migration 001
--     -- Postgres's default UNIQUE constraint on varchar is case-
--     sensitive. Concretely: under the current schema, 'Victor' and
--     'victor' are DISTINCT values and MAY COEXIST as two separate,
--     valid identity.users.username rows -- the UNIQUE constraint
--     does not consider them a collision. This function performs
--     the identical case-sensitive comparison, deliberately: if this
--     check instead normalized case, it could incorrectly report
--     'victor' as unavailable/taken solely because 'Victor' already
--     exists, even though the authoritative constraint would happily
--     permit both -- an advisory check that is WRONGER than the real
--     constraint is worse than no check at all. The rule is that
--     advisory semantics must exactly mirror the authoritative
--     constraint's actual behavior, not a "safer-sounding" but
--     factually incorrect approximation of it. No normalization of
--     any kind (case, whitespace-trimming-for-comparison, etc.) is
--     architecturally authorized anywhere in this schema, so none is
--     introduced here.
--   - Defensive input handling: NULL, empty, whitespace-only, and
--     overlength (>50 characters, identity.users.username's own
--     limit) input are all treated as NOT available (returns false)
--     rather than raising an exception. Rationale: an invalid
--     candidate username is certainly not "available" in any
--     meaningful sense, and this avoids requiring bespoke client-
--     side error handling for what is an input-shape issue, not a
--     security-relevant case. The parameter type is `text`
--     (unbounded), not `varchar(50)`, specifically so an overlength
--     value is handled by this function's own explicit length check
--     rather than erroring at parameter-binding time the way
--     assigning an overlength string to a varchar(50) PL/pgSQL
--     variable would (the same behavior noted, but not changed, in
--     011_provision_identity_from_auth_signup.sql's own Notes).
--   - Return semantics: boolean only, always non-NULL. true =
--     available (not taken AND a structurally valid candidate).
--     false = taken, OR the input was invalid. The caller cannot
--     distinguish "taken" from "invalid" from this return value
--     alone -- deliberate: distinguishing them would require
--     returning more information than "is this available," which is
--     the whole point of keeping this function's surface minimal.
--   - Enumeration/privacy: this function is, by its very nature, an
--     existence-enumeration primitive -- true of this exact feature
--     category on every platform that has ever shipped it, not a
--     defect unique to this design, and not eliminable while
--     satisfying the approved requirement for a check to exist. The
--     scope commitment is what makes this narrow, not the absence of
--     enumeration: this function returns ONLY a boolean, never
--     email, never a UUID, never role/status/any other
--     identity.users column, never a "did you mean" suggestion.
--     Existence-of-one-specific-guessed-string is the only thing
--     exposed, bounded by needing a real string guess per call (not
--     a bulk-enumerable range). This risk is disclosed here, not
--     claimed to be eliminated.
--   - Privilege model, individually justified, not granted
--     mechanically:
--       anon          -- GRANTED. This is the entire reason this
--                        function exists: a pre-signup, necessarily
--                        unauthenticated caller needs to check a
--                        candidate username before committing to
--                        signup.
--       authenticated -- NOT granted. EWP-011's scope contains no
--                        username-editing UI for already-signed-in
--                        users; there is no current, evidenced
--                        caller. A future EWP adding username changes
--                        should add this grant then, via its own
--                        migration, justified by its own real need.
--       service_role  -- NOT granted. No backend/server-side code
--                        path needs to check username availability
--                        server-side; the only caller is the
--                        anonymous browser pre-signup flow.
--     PUBLIC is explicitly revoked with no other compensating grant
--     beyond anon, applying Migration 010/011's own established
--     discipline of explicit-grant-from-creation.
--
-- Future expansion:
--   - If a later EWP adds authenticated username changes, that EWP
--     should add its own explicit `authenticated` grant then, not
--     assume this one already covers it.
--
-- Source of truth: docs/phase-7-charter.md (EWP-011 scope);
-- docs/architecture-decisions.md (ADR-018, "Username authority
-- rule"); Founder/Chief-Architect-approved Gate 1/Gate 2 design,
-- 2026-07-22.
-- =============================================================================

create or replace function api.is_username_available(p_username text)
returns boolean
language plpgsql
stable
security definer
set search_path = api, pg_temp
as $$
begin
  if p_username is null
     or btrim(p_username) = ''
     or length(p_username) > 50 then
    return false;
  end if;

  return not exists (
    select 1 from identity.users where username = p_username
  );
end;
$$;

revoke execute on function api.is_username_available(text) from public;

grant execute on function api.is_username_available(text) to anon;

-- Discovered during local live-test validation, not assumed: migration
-- 008 grants USAGE on schema api only to authenticated/service_role --
-- anon has never had it. Postgres's two-layer privilege model means
-- the EXECUTE grant above is inert without this: a role needs BOTH
-- schema-level USAGE and object-level EXECUTE to call a function.
-- This grants ONLY schema-level namespace access to anon -- it does
-- NOT grant anon any privilege on any other object in the api schema;
-- every other function/procedure/view's own object-level grants
-- (migration 008, authenticated/service_role only) are completely
-- unaffected and remain the actual gate. Verified directly (not
-- assumed) via a full catalog enumeration of every api routine's
-- effective anon privileges after this grant was added -- see
-- backend/tests/live/username-availability.test.ts and the
-- accompanying EWP-011 verification record.
grant usage on schema api to anon;
