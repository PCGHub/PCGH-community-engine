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

## service_role Client-Bundle Verification

Executed against the actual `npm run build` output (`.next/static`), not assumed:

```text
grep -r "service_role\|SUPABASE_SERVICE_ROLE_KEY" .next/static
```

Result: no matches. See the Step 15 compliance review for the full command and output.
