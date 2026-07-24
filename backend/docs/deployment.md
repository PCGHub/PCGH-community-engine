# Deployment

Phase 5 Step 15 deliverable: deployment pipeline, observability wiring, and rollback plan, per `docs/backend-architecture.md`'s Observability and External Integrations sections. This document does not redefine architecture — see `docs/application-architecture-freeze.md` and `docs/backend-architecture.md` for what is already approved.

---

## What this covers

```text
CI pipeline (implemented, automated) -- typecheck, test, build
  on every push/PR to main (.github/workflows/ci.yml)
Observability wiring (implemented) -- structured logs, an interim
  log-based audit trail, metrics, and request-tracing identifiers
  (app/utils/logger.ts, audit.ts, metrics.ts, tracing.ts)
Rollback plan (documented, below)
service_role client-bundle verification (executed, see below)
```

## What this does NOT cover, and why

```text
Actual production deployment (standing up a live hosting
  environment, DNS, environment secrets) is NOT executed here.
  There is no live hosting account, Supabase project, or deployment
  credential available in this environment/session, and standing
  one up is a hard-to-reverse action affecting a real, shared
  system -- exactly the kind of action this project's own
  operating discipline requires explicit, informed authorization
  for, not autonomous execution. What follows is preparation:
  everything is ready to deploy the moment real infrastructure and
  credentials exist.
```

---

## Recommended deployment target (not provisioned)

Next.js's first-party hosting platform (Vercel) is the natural fit for this stack and requires no new External Integration decision beyond what's already approved (Next.js itself). This is a recommendation for the Founder to act on, not a decision made or executed here.

```text
1. Connect the repository to a hosting provider (e.g. Vercel).
2. Set environment variables from backend/.env.example:
   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   SUPABASE_SERVICE_ROLE_KEY (server-side/secret only -- never
   expose as a build-time public variable), AI_SERVICE_URL
   (optional, unconnected).
3. Confirm the Supabase project exposes both `api` and `identity`
   schemas via its Data API settings (see docs/technical-debt.md
   TD-001 and TD-002 for why `identity` must also be exposed).
4. Deploy from the `main` branch after CI passes.
```

---

## Rollback Plan

```text
Application code: revert the deploying commit (git revert) and
  redeploy. Every hosting provider covered above keeps prior
  build artifacts, so a rollback is redeploying the last-known-good
  build, not a destructive operation.

Database: per CLAUDE.md's Migration Rules ("Never modify previous
  migrations. Always create new migrations."), a bad migration is
  never rolled back by editing/reverting the migration file itself.
  It is corrected by a new, forward-only migration. This preserves
  the same audit trail this project's RLS/security model already
  depends on.

Feature flags: governance.feature_flags (migration 007/009) already
  exists for this exact purpose -- disable a feature live via
  api.is_feature_enabled()'s backing table rather than a code
  rollback, when the affected behavior is flag-gated.
```

---

## Local/CI Supabase Stack (EWP-008, Phase 7)

Distinct from both the "Recommended deployment target" above (a future real hosting/production concern) and the future staging project (EWP-009): a disposable, real Postgres/Supabase Auth/PostgREST stack, run via the Supabase CLI (pinned exact version in `backend/package.json`'s `devDependencies`, invoked through `npx`/npm scripts so the committed lockfile controls the version identically in local development and CI -- no second, independent installation mechanism).

```text
npm run supabase:start   -- boots the stack, applies migrations
                             001-009 (and any later Phase 7
                             migration) from a clean state
npm run test:live        -- runs backend/tests/live/ only, against
                             whichever real Supabase target
                             TEST_SUPABASE_* points at
npm run supabase:stop    -- tears the stack down
```

Wired into `.github/workflows/ci.yml` as a separate `live-tests` job — a failure there fails the overall workflow, but it never affects the existing `backend` job's own fast, mocked-client signal. The job's own generated local-stack keys are captured fresh from `supabase start`'s output each run; no GitHub Actions secret is used by this job, and `tests/helpers/live-supabase-client.ts` fails closed (throws) if `TEST_SUPABASE_URL`/`TEST_SUPABASE_ANON_KEY`/`TEST_SUPABASE_SERVICE_ROLE_KEY` are ever unset — it never falls back to `NEXT_PUBLIC_SUPABASE_*`/`SUPABASE_SERVICE_ROLE_KEY`, specifically so `tests/live/` can never accidentally target a real staging or production project once one exists.

**Verified live, per QGR-003 ("Verify, Don't Assume"), 2026-07-20:** after Docker Desktop (with WSL2) was installed, `supabase start` was executed against a genuinely clean stack. Image pulls from `public.ecr.aws` were slow and required many automatic retries on this network (large layers, particularly `postgres` at ~360MB, repeatedly truncated before succeeding on retry) — a real, reproducible network characteristic of this environment, not a Docker or configuration defect. All required images eventually downloaded and every container reported healthy. `npm run test:live` then passed 7/7 against the real stack, proving migrations 001–008 applied correctly (verified via `identity.users` directly and one representative `api.*` view per business schema — `information_schema` introspection was tried first and correctly rejected by PostgREST, confirming `config.toml`'s schema-exposure restriction works as reviewed). Migration 009 (seed data) is not separately live-tested (see `tests/live/infrastructure.test.ts`'s own comment for why an admin-gated view can't be used for this with a bare service-role client) but is proven by the stack booting without error. One real bug was found and fixed during this verification: `@supabase/supabase-js`'s `createClient()` always constructs a `RealtimeClient`, which requires a WebSocket implementation Node 20 lacks natively — fixed by adding `ws` as a devDependency and passing it as the `realtime.transport` option in `tests/helpers/live-supabase-client.ts`. The CI `live-tests` job's key-extraction step was also independently re-verified against real `supabase status -o json` output (its "Stopped services" notice prints to stderr, not stdout, so the existing plain-pipe extraction is unaffected).

---

## Real Supabase Staging Environment (EWP-009, Phase 7)

The persistent, shared, cloud staging project — distinct from both the disposable local/CI stack above (EWP-008) and any future production project (Section 6, not yet provisioned):

```text
Project:    PCGH Community Engine - Staging
Org:        PCHub's org
Reference:  lnoradklbsxetytlhjcf
Region:     Europe (Central EU / Frankfurt)
```

**Provisioning method:** the Founder created the project manually via the Supabase Dashboard (a real, billable, account-linked resource — not something any automation could or should create unattended). Migrations were applied via `supabase link --project-ref lnoradklbsxetytlhjcf` followed by `supabase db push`, executed by the Founder directly in their own terminal — the database password and CLI access token never crossed into any tool-driven command, by design, the same discipline this project has applied to every credential throughout.

**Verified live, 2026-07-21:**

```text
Migrations 001-010 applied and independently confirmed via
  `supabase migration list` (Local/Remote match on every version)
  -- not merely inferred from the push command's own "Finished"
  message.

Object inventory (schemas, 41 base tables, 11 api views, 18
  api/identity routines) cross-checked row-for-row against
  migrations 001-008 -- exact match.

RLS: all 41 business-schema tables confirmed rowsecurity = true;
  all 81 RLS policies cross-checked exactly (schema, table,
  policy name, command, role) against migrations 001-008.

Grants: every table/view grant across all 8 schemas cross-checked
  exactly against each migration's own GRANT statements --
  authenticated/service_role only, zero unexpected anon grants
  anywhere.

Routine EXECUTE privileges: surfaced a real finding -- see
  Migration 010, below.

Data API exposed schemas: corrected from the hosted default
  (public, graphql_public) to api, identity -- deferred until
  api/identity existed remotely (Postgres populates this
  selector from schemas that actually exist), then verified
  against the grant architecture (zero public-schema dependencies
  found across all 9 migrations) before applying. Extra search
  path left unchanged (public, extensions) -- a distinct setting
  governing internal search_path resolution for extension
  functions, not API exposure.

Seed migration 009: all five seeded tables' row counts and
  literal values (badges, feature_flags, system_settings,
  governance_rules, ai_controls) cross-checked exactly against
  the migration's own literals, including DEFAULT_COOLDOWN_DAYS
  = 14 -- a hard runtime dependency of api.rotate_campaign().
```

### Migration 010 — identity routine EXECUTE remediation

Discovered during EWP-009's routine-privilege verification (`has_function_privilege()`/`proacl`): `identity.current_user_id()`, `identity.is_admin()`, and `identity.set_updated_at()` (migration 001) had never had `EXECUTE` explicitly granted or revoked, leaving Postgres's implicit `PUBLIC`-execute default in effect (`anon_execute = true`, `proacl = NULL`) — unlike `api`'s 15 routines, which carry an explicit ACL excluding `anon`. Logged and resolved as **TD-008** (`docs/technical-debt.md`).

`010_secure_identity_routine_execute.sql` (new, forward-only — migrations 001–009 untouched) revokes `PUBLIC` `EXECUTE` on all three and explicitly re-grants `authenticated`/`service_role` only. Validated locally first (`supabase db reset` applying 001–010 fresh, then `npm run test:live` — 11/11 passing, including the new `tests/live/identity-routine-privileges.test.ts`: anon rejected on both RPCs, `service_role` still permitted, the `updated_at` trigger still fires correctly on `UPDATE`) before remote application. Applied to staging via the Founder-executed `db push`, then independently re-verified: `anon_execute = false`, `authenticated_execute = true`, `service_role_execute = true`, an explicit non-`NULL` ACL for all three, all 15 `api` routines unchanged.

### Staging admin identity bootstrap

One admin identity was bootstrapped as a documented, one-time exception — ADR-018's automatic identity-provisioning trigger is EWP-010's own deliverable and does not exist yet. The `auth.users` row was created via the Supabase Dashboard's "Add user" (a supported Auth mechanism, never a raw `auth.users` insert); the matching `identity.users`/`identity.user_roles` rows were created via a single transactional SQL block with pre-condition checks (the `auth.users` row exists and matches; no prior bootstrap for this `auth_user_id`) and a post-insert verification check before commit, run once by the Founder in the SQL Editor. Independently re-verified via a read-only query: exactly one `identity.users` row, correctly linked to its `auth.users` row and to an `identity.user_roles` row with `role_name = 'admin'`. This is not a reusable pattern — every subsequent user is expected to be provisioned by EWP-010's real trigger once it exists.

### TD-007 staging-reachability assessment

Per TD-007's binding resolution gate, EWP-009 assessed whether the staging project would be publicly internet-reachable. Finding: EWP-009's locked scope deploys no Next.js code anywhere — the Supabase project's own PostgREST/Auth API is inherently internet-reachable (a Supabase Cloud characteristic, not an EWP-009 decision), but TD-007's actual risk (bundled `next` CVEs) is not triggered by this EWP. Full reasoning recorded in `docs/technical-debt.md`'s TD-007 entry. This gate re-activates the moment a future EWP deploys the Next.js application somewhere reachable.

## Migration 011 — Automatic Identity Provisioning (ADR-018, EWP-010)

Closes the gap confirmed live while scoping this EWP: `backend/app/auth/session.ts`'s `resolveSession()` calls `identity.current_user_id()`, which returns `NULL` with no matching `identity.users` row — meaning, before this migration, no real Supabase Auth signup could ever successfully authenticate against the existing Authentication Service.

`011_provision_identity_from_auth_signup.sql` (new, forward-only — migrations 001–010 untouched) adds `identity.handle_new_auth_user()` (`SECURITY DEFINER`, `search_path` pinned to `identity, pg_temp`) and an `AFTER INSERT` trigger (`on_auth_user_created`) on `auth.users`. In one transaction with signup, it provisions exactly one `identity.users` row and exactly one `identity.user_roles` row (`'member'`, hardcoded — no client-supplied metadata can ever produce `'creator'`/`'admin'`). `EXECUTE` is explicitly revoked from `PUBLIC` with **no** compensating grant to `anon`/`authenticated`/`service_role` — this function is trigger-only, and per Migration 010's own finding, trigger firing is gated by the firing role's privilege on the underlying table, not by `EXECUTE` on the trigger function itself.

**Design details, precise:**
```text
username: read from signup metadata (raw_user_meta_data->>'username'),
  never derived from email, per ADR-018. Missing/empty username
  aborts the signup atomically -- EWP-011 owns collecting it in the
  actual signup UX.
user_code: 'USR-' + 16 uppercase hex characters derived from the
  row's own newly-generated id -- 64 bits of entropy, explicitly
  documented as probabilistically unique, not mathematically
  guaranteed. The column's UNIQUE NOT NULL constraint is the actual
  integrity safeguard.
Idempotency: a pre-existing identity.users row for a given
  auth_user_id is a safe no-op only if its email and username
  exactly match what's being provisioned now; any mismatch aborts
  loudly rather than silently reusing inconsistent state. This
  branch (both halves) is verified by code review only -- no
  legitimate Auth API path can cause the same auth_user_id to be
  inserted twice, so it cannot be exercised by an automated live
  test without weakening the zero-EXECUTE-grant design.
```

**Validated locally first:** `supabase db reset` applying 001–011 fresh, then `npm run test:live` — 15/15 passing (7 existing infrastructure + 4 existing Migration 010 + 4 new: successful provisioning, self-contained username-collision atomicity, missing-username atomicity, role-escalation-attempt rejection). `lint`/`typecheck`/`npm test` (37/131)/`build` all unaffected. Deployed to staging via Founder-executed `db push`; independently re-verified: migration history 001–011 match, the deployed function definition and trigger binding are identical to the reviewed source, and `EXECUTE` privileges confirmed `anon=false/authenticated=false/service_role=false` for the new function, with the other three `identity` routines unchanged.

**Real controlled staging signup (Admin API, `email_confirm: true`):** proved the full chain — one correctly-linked `identity.users` row (`user_code` matching `USR-[0-9A-F]{16}`, username/email preserved), exactly one `'member'` role row, `status` at its schema default (`'pending'`, since Migration 011 never sets it). `email_verified` returned `false` despite the API response showing `email_confirmed_at` populated — traced and confirmed as a real instance of **TD-009** (`docs/technical-debt.md`), not a new defect: Supabase's Auth service appears to write the confirmation timestamp as a step distinct from the base insert, which this `AFTER INSERT`-only trigger never observes. Deliberately not fixed here — ADR-018 describes only an `AFTER INSERT` trigger; synchronization would be new architecture requiring its own ADR.

**Cleanup verification note, disclosed rather than smoothed over:** an initial `DELETE` (without `RETURNING`) against the test `identity.users` row produced an ambiguous "Success. No rows returned" result that was mistakenly read as proof of deletion — the row had not actually been removed, and its `NO ACTION` foreign key to `auth.users` was still blocking the subsequent Auth-side user deletion as a direct, diagnosable consequence. Corrected via `DELETE ... RETURNING` (positively confirming which row was removed) plus an independent read-only count check, before the Auth-side test user was removed through Supabase's supported deletion mechanism (never raw SQL against `auth.users`). Final residue confirmed zero across `identity.users`, `identity.user_roles`, and `auth.users`.

The existing bootstrapped `pcgh_admin` identity (EWP-009) is unaffected by this migration — `AFTER INSERT` triggers never fire retroactively for rows inserted before the trigger existed.

---

## EWP-011 — Signup/Login Onboarding UI

Implements the charter's EWP-011 scope: minimal registration/login forms calling Supabase Auth directly, plus an advisory, client-side username-availability check. **COMPLETE / VERIFIED, 2026-07-24.** The Next.js application is deployed to a Vercel Preview environment, and the charter's exit criterion ("a real person can sign up and log in through the deployed staging UI") has been met via a real, controlled browser test account exercising the full flow end to end.

**New forward-only migration:** `012_add_username_availability_check.sql` adds `api.is_username_available(text)` — PCGH's first anon-facing database capability. `SECURITY DEFINER`, boolean-only return (never email/UUID/role/status), case-sensitive comparison deliberately matching `identity.users.username`'s real `UNIQUE` constraint exactly (no normalization introduced — `'Victor'`/`'victor'` remain distinct, coexisting values, and the check must never claim otherwise). Defensive input handling (`NULL`/empty/whitespace/overlength all return `false`, never an exception). Grants individually justified: `anon` only — `authenticated`/`service_role` explicitly withheld, since neither has any evidenced caller in this EWP's scope.

**New application code:** `app/(auth)/{signup,login}/page.tsx` (Server Components) rendering `SignupForm`/`LoginForm` (`'use client'` — the first Client Components in this codebase; every existing dashboard is read-only and needed none). `app/config/supabase-browser.ts` (`@supabase/ssr`'s `createBrowserClient`) — this is also what makes the existing dashboards' `getServerComponentAccessToken()` functionally meaningful for the first time, since nothing previously ever wrote a session cookie for it to read. `app/services/auth/auth-service.ts` (`performSignup`/`performLogin`/`checkUsernameAvailability`), following the existing `services/<domain>/<domain>-service.ts` convention, with error mapping preferring `@supabase/supabase-js`'s structured `AuthError.code` over substring matching. Username availability is debounced (~450ms) on change plus an immediate check on blur, via `useUsernameAvailability` — a single hook owning both the debounce timer and a request-generation counter, so a blur-triggered immediate check and a pending debounced check can never both fire, and a stale response can never overwrite a newer value's result.

**Two real database/test issues found and fixed during pre-deployment validation — disclosed here, not silently corrected:**

1. **Missing anon schema `USAGE`.** Migration 008 grants schema-level `USAGE` on `api` to `authenticated`/`service_role` only — `anon` never had it. The new function's `EXECUTE` grant to `anon` was therefore inert (Postgres requires both schema `USAGE` and object `EXECUTE`). Found via local live-test failure (`permission denied for schema api`), not assumed correct in advance. Corrected with one additional statement in the same migration: `grant usage on schema api to anon;` — scoped to namespace access only. Verified this didn't inadvertently expose anything else via a full 16-routine catalog enumeration (`has_function_privilege('anon', ...)` across every `api.*` function/procedure), both locally and on staging: `is_username_available` is the only one with `anon_execute = true`; all 15 pre-existing routines remain `false`, unaffected.
2. **Test-client session reuse.** An early version of the "exact-case taken username" live test called `signUp()` and then reused the *same* client instance for the subsequent availability-check RPC. `signUp()` attaches the new session to that client, so the reused client was actually calling as `authenticated`, not `anon` — failing with "permission denied for function" for the correct reason (by design, `authenticated` has no grant on this function) but for the wrong reason relative to what the test intended to prove. Fixed by constructing a fresh, genuinely-anonymous client for the actual checks.

**Local validation:** `supabase db reset` applying 001–012 fresh (twice — once before the anon-`USAGE` fix, once after); `lint`/`typecheck`/`npm test` (39 suites/142 tests, including new `SignupForm`/`LoginForm` component tests covering debounce-one-call, blur-cancels-pending-timer-no-duplicate, stale-response-discarded-on-inverted-resolution-order, in-flight-result-invalidated-on-input-change, and no-state-update-after-unmount)/`build` all clean. A dependency-version mismatch was separately caught before staging deployment: `jest-environment-jsdom` had installed at `30.4.1` against `jest@29.7.0` (Jest's own packages release in lockstep at matching version numbers, confirmed via `npm view`) — realigned to `29.7.0` exactly, re-validated clean, zero new `npm audit` findings beyond the pre-existing TD-007 entries.

**Staging deployment and verification:** deployed via Founder-executed `db push` (migration history 001–012 confirmed matching Local/Remote before and after). Independently re-verified: deployed function definition identical to the reviewed source (modulo Postgres's own formatting normalization); schema `USAGE` confirmed for `anon`; full 16-routine privilege enumeration confirmed `is_username_available` is the *only* `anon`-executable routine, raw ACL `{postgres=X/postgres,anon=X/postgres}` (no `PUBLIC` entry); seven real anonymous RPC cases against staging (a genuinely unique name → available; an existing exact-case staging username → taken; its case-different form → available, confirming case-sensitive semantics live; `NULL`/empty/whitespace/overlength → all unavailable) all passed with direct terminal evidence. No temporary account or data was created during this validation.

**Application deployment (Vercel Preview):** the Next.js application was provisioned on Vercel — no prior deployment mechanism existed in this project before this EWP. The initial deploy-on-import ran against `main` (already-approved EWP-010 code); no cost or hosting decision beyond this Preview deployment has been made. `pcgh.online`, a real custom domain discovered already connected to the Vercel project, remains connected but untouched, deferred to a separate, explicit Public Production LIVE decision — it played no role in this EWP's staging validation, which used the Vercel-assigned `pcgh-community-engine.vercel.app` / Preview-alias domains instead.

**Three real deployment-layer defects found and fixed during real deployed-browser validation — each diagnosed from actual evidence, not assumed:**

1. **Static-inlining defect (code).** `getPublicEnv()` (`app/config/env.ts`) originally read `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` through a dynamic `requireEnv(name)` helper (`process.env[name]`). Next.js's build-time client-bundle inlining only recognizes static, literal `process.env.NEXT_PUBLIC_X` expressions — confirmed against Next.js's own documentation, which explicitly names dynamic lookups as not inlined — so the deployed Preview's browser bundle always resolved these to `undefined`, regardless of correct Vercel environment-variable configuration or cache-free redeploys. Fixed via a new `requirePublicValue(name, value)` taking an already-extracted value, called with literal `process.env.NEXT_PUBLIC_X` expressions at the call site. `requireEnv`/`getServerEnv()` (genuine server-only runtime code, e.g. `SUPABASE_SERVICE_ROLE_KEY`) were deliberately left unchanged — dynamic access is safe there since server code runs in a real Node.js process with no client-bundle inlining involved. Empirically confirmed, not just structurally: a local rebuild with real values set was grepped directly against the compiled `.next/static/chunks/` output, confirming the literal value was inlined into both the `/signup` and `/login` client chunks.
2. **Missing exception handling (code).** `useUsernameAvailability`'s `runCheck()` had no `try`/`catch` around the availability call, so any throw (including defect #1 above, or any future network/RPC failure) left `availability` stuck at `'checking'` indefinitely with no recovery path. Fixed with a `try`/`catch` resolving any failure to `'unknown'` → `'idle'`, verified by a dedicated component test asserting no permanent "Checking availability..." state.
3. **Redirect misconfiguration (configuration, not code alone).** The staging Supabase project's Auth **Site URL** was still `http://localhost:3000` — never updated since EWP-009, when no Next.js deployment existed — and `signUp()` supplied no deployment-origin override, so confirmation emails linked to an unreachable `localhost` (`ERR_CONNECTION_REFUSED`). Resolved through two coordinated changes: (a) Supabase Auth URL Configuration, applied by the Founder in the dashboard — Site URL set to `https://pcgh-community-engine.vercel.app`; Redirect URLs including `https://*-pcgrowthhub-2263s-projects.vercel.app/**` (matching the project's actual observed Vercel Preview hostname structure) and `http://localhost:3000/**`; and (b) an application-side patch — `performSignup()` gained an optional `emailRedirectTo` parameter, deliberately computed by `SignupForm.tsx` (browser-only, via `window.location.origin`) rather than inside `auth-service.ts` itself, since that module is also called directly by `tests/live/identity-provisioning.test.ts` in a plain Node environment with no `window` global — this hazard was identified and corrected before implementation shipped.

**Real deployed-browser validation (2026-07-24):** using a controlled/real browser test account (not a synthetic or Admin-API-created account), the full charter exit-criterion flow was exercised against the deployed Preview: username-availability check → signup → email confirmation (via the corrected deployed redirect) → login → authenticated `/community` access. Independent read-only database/Auth verification afterward confirmed: exactly one `identity.users` row and exactly one `identity.user_roles` row (`member`) for this account; Auth UID `00fac57d-2055-4df4-8ec8-79cf6a28c1d3` matching the `identity.users` row's own `id` exactly; `user_code = USR-2DB72A7B58444783`; Auth-side `Confirmed at` and `Last signed in` both populated; `identity_user_count = 1`; `role_count = 1`. `identity.users.status = 'pending'` and `email_verified = false` were observed on this same row — this is the already-disclosed **TD-009** signup-time-only synchronization limitation (`docs/technical-debt.md`), not a new defect and not fixed by this EWP.

**TD-007 factual note:** this deployment means an internet-reachable Vercel Preview of the application now exists, with no deployment-access-control mitigation (e.g. Vercel Preview password/SSO protection) documented or applied in this workflow. This is recorded factually; it is not classified as an EWP-011 failure or a security incident. TD-007's existing binding resolution gate before unrestricted Public Production LIVE remains unchanged.

---

## service_role Client-Bundle Verification

Executed against the actual `npm run build` output (`.next/static`), not assumed:

```text
grep -r "service_role\|SUPABASE_SERVICE_ROLE_KEY" .next/static
```

Result: no matches. See the Step 15 compliance review for the full command and output.
