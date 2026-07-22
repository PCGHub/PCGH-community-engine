-- =============================================================================
-- Migration: 011_provision_identity_from_auth_signup.sql
--
-- Purpose:
--   Implements ADR-018 (Identity Provisioning Mechanism): connects
--   Supabase-managed auth.users to PCGH-owned identity.users/
--   identity.user_roles automatically on signup. Closes the gap
--   confirmed live during this review: backend/app/auth/session.ts's
--   resolveSession() calls identity.current_user_id(), which returns
--   NULL with no matching identity.users row -- meaning, until this
--   migration, no real signup can ever successfully authenticate
--   against the existing Authentication Service.
--
-- Responsibilities:
--   - identity.handle_new_auth_user(): SECURITY DEFINER, AFTER INSERT
--     trigger function on auth.users. Provisions exactly one
--     identity.users row and exactly one identity.user_roles row
--     ('member') in the same transaction as signup.
--   - Fails the entire signup transaction (no orphaned auth.users
--     row -- standard Postgres AFTER-trigger semantics) if: no valid
--     username is supplied, or a pre-existing identity.users row for
--     this auth_user_id has a mismatched email/username.
--   - Revokes PUBLIC EXECUTE with no compensating grant -- this
--     function is trigger-only, applying Migration 010's own lesson
--     from the start.
--
-- Relationships:
--   Depends on 001_create_identity_schema.sql (identity.users,
--   identity.user_roles) and Supabase-managed auth.users. Does not
--   modify migrations 001-010 -- forward-only, per DSR-003.
--
-- Notes:
--   - username is read from NEW.raw_user_meta_data->>'username' --
--     the user's own signup-time choice, per ADR-018's explicit
--     "never derived from the user's email address." Missing/empty
--     username aborts the signup; EWP-011 owns requiring/collecting
--     it in the actual signup UX.
--   - user_code format: 'USR-' + 16 uppercase hex characters derived
--     from the row's own newly-generated id (hyphens stripped),
--     encoding 64 of the UUID's 128 bits. The 64-bit derived code is
--     probabilistically unique, not mathematically guaranteed unique.
--     The UNIQUE NOT NULL database constraint is the authoritative
--     integrity safeguard; any collision raises unique_violation and
--     aborts the transaction.
--   - email_verified is derived from NEW.email_confirmed_at is not
--     null AT SIGNUP TIME ONLY. It is never updated afterward by
--     this or any other mechanism -- if a user signs up unconfirmed
--     and later confirms their email (a real auth.users UPDATE this
--     AFTER INSERT trigger never observes), this column becomes
--     stale and does NOT reflect the true, current confirmation
--     state. It is NOT authoritative for live confirmation status;
--     no code in this codebase currently reads it (confirmed by
--     direct grep), and any future consumer needing live-accurate
--     status must check auth.users.email_confirmed_at directly.
--     Logged as TD-009 (docs/technical-debt.md) -- an explicitly
--     disclosed, currently-inert gap, not fixed here because ADR-018
--     describes only an AFTER INSERT trigger; adding synchronization
--     is new architecture requiring its own ADR amendment, not a
--     unilateral addition inside this EWP.
--   - Idempotency/role invariant, precise: a pre-existing
--     identity.users row for a given auth_user_id is a safe no-op
--     ONLY if its email and username exactly match what is being
--     provisioned now (see the mismatch check below) -- any
--     mismatch aborts loudly. Separately, the 'member' role insert
--     (ON CONFLICT (user_id, role_name) DO NOTHING) is scoped to
--     exactly the (user_id, 'member') pair -- it can never touch,
--     remove, or modify a DIFFERENT role_name row (e.g. an existing
--     'creator'/'admin' grant from a later EWP-012 action); two
--     different role_name values are independent rows under
--     identity.user_roles' own unique(user_id, role_name)
--     constraint. This function contains no code path referencing
--     any role_name literal other than 'member' -- no client
--     metadata, retry, or otherwise can ever produce 'creator' or
--     'admin'.
--   - The existing bootstrapped pcgh_admin identity (EWP-009) is
--     unaffected: AFTER INSERT triggers never fire retroactively for
--     rows inserted before the trigger existed.
--
-- Future expansion:
--   - TD-009: synchronizing identity.users.email_verified with later
--     auth.users.email_confirmed_at changes is explicitly deferred,
--     pending either an ADR-018 amendment or a documented decision
--     that this column is signup-time-only by design.
--
-- Source of truth: ADR-018 (docs/architecture-decisions.md);
-- Founder/Chief-Architect-approved EWP-010 scope, 2026-07-21.
-- =============================================================================

create or replace function identity.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = identity, pg_temp
as $$
declare
  v_username   varchar(50);
  v_new_id     uuid;
  v_user_code  varchar(20);
  v_user_id    uuid;
  v_existing   identity.users%rowtype;
begin
  v_username := new.raw_user_meta_data ->> 'username';

  if v_username is null or btrim(v_username) = '' then
    raise exception 'identity.handle_new_auth_user: signup metadata did not include a username -- aborting, no identity created for auth_user_id %', new.id;
  end if;

  select * into v_existing
  from identity.users
  where auth_user_id = new.id;

  if found then
    -- Genuine retry only if email AND username match exactly --
    -- otherwise this is inconsistent prior state, and must fail
    -- loudly rather than silently reuse it.
    if v_existing.email is distinct from new.email
       or v_existing.username is distinct from v_username then
      raise exception
        'identity.handle_new_auth_user: identity.users row % already exists for auth_user_id % but does not match the current signup (existing email/username: %/%, incoming: %/%) -- refusing to silently reuse, aborting',
        v_existing.id, new.id, v_existing.email, v_existing.username, new.email, v_username;
    end if;

    v_user_id := v_existing.id;
  else
    v_new_id := gen_random_uuid();
    v_user_code := 'USR-' || upper(substr(replace(v_new_id::text, '-', ''), 1, 16));

    insert into identity.users (
      id, auth_user_id, user_code, email, username, email_verified
    )
    values (
      v_new_id, new.id, v_user_code, new.email, v_username, new.email_confirmed_at is not null
    )
    returning id into v_user_id;
  end if;

  -- Scoped to exactly (user_id, 'member') -- cannot conflict with,
  -- touch, or affect any other role_name row this identity may hold.
  -- No literal other than 'member' appears anywhere in this function.
  insert into identity.user_roles (user_id, role_name)
  values (v_user_id, 'member')
  on conflict (user_id, role_name) do nothing;

  return new;
end;
$$;

revoke execute on function identity.handle_new_auth_user() from public;
-- No compensating grant to authenticated, anon, or service_role --
-- this function is trigger-only; nothing in this codebase calls it
-- directly. Trigger firing is gated by the firing role's privilege
-- on auth.users (owned by Supabase's own Auth service), not by
-- EXECUTE on this function, per Migration 010's finding.

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function identity.handle_new_auth_user();
