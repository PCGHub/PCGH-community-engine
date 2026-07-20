# tests/live/

EWP-008 (Phase 7). Real Supabase/PostgreSQL integration, RLS, trigger, and concurrency tests -- the one test category in this project that a mocked PostgREST client (`tests/unit/`, `tests/integration/api/`) cannot meaningfully prove, per `docs/phase-7-charter.md`'s Testing Architecture section.

## Running

```
npm run supabase:start   # boots the local Postgres/Auth/PostgREST stack
npm run test:live        # runs this directory only, via jest.live.config.js
npm run supabase:stop    # tears the stack down
```

Requires `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY` to be set (see `.env.example`) -- `tests/helpers/live-supabase-client.ts` fails closed (throws) if any are missing, and never falls back to the application's own `NEXT_PUBLIC_SUPABASE_*`/`SUPABASE_SERVICE_ROLE_KEY` variables, specifically so this suite can never accidentally target a real staging or production project.

## Excluded from `npm test`

`jest.config.js`'s `testPathIgnorePatterns` explicitly excludes this directory, and `jest.live.config.js`'s own `testMatch` is the only config that targets it -- two independent layers, so a single misconfiguration cannot silently defeat the separation. A plain `npm test` never attempts a real database connection.

## Convention

One file per capability under test, mirroring `tests/integration/api/`'s per-route convention where it makes sense, but at whatever granularity a given live invariant (a trigger, a lock, a concurrency race) actually requires -- not forced into a one-file-per-route shape.

## `.gitignore` finding, corrected during implementation (audit trail)

The EWP-008 scope review claimed no `.gitignore` excluded `.env`/`.env.local` anywhere in the repository, contradicting `docs/phase-5-completion.md`'s Security Status claim. **That claim was only partially correct and is corrected here:** the scope review checked only the repository-root `.gitignore`. `backend/.gitignore` (a separate file, not inspected during scope review) already contained `.env` and `.env.local` entries -- and since Next.js reads env files from `backend/`, not the repo root, that file was the operationally relevant one all along. Phase 5's claim was therefore accurate.

What EWP-008 actually added: a defense-in-depth `.env`/`.env.local`/`.env.*.local` exclusion (with an explicit `!.env.example` negation) at the **repository root**, protecting any future root-level env file this project doesn't currently have, plus the broader `.env.*.local` pattern `backend/.gitignore` didn't previously cover. Verified explicitly with `git check-ignore -v` after the change: `backend/.env`/`backend/.env.local` are ignored (matched by `backend/.gitignore`), `backend/.env.example` is not ignored (remains trackable).

A full git-history scan (`git log --all --full-history --diff-filter=A -- "*.env" "*.env.*"`) confirmed the only file ever committed matching an `.env`-style pattern, at either level, is `backend/.env.example` itself -- no real secret was ever committed.
