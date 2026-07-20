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

## service_role Client-Bundle Verification

Executed against the actual `npm run build` output (`.next/static`), not assumed:

```text
grep -r "service_role\|SUPABASE_SERVICE_ROLE_KEY" .next/static
```

Result: no matches. See the Step 15 compliance review for the full command and output.
