# backend/tests/

Phase 5 Step 14 (Testing) test suite, per `docs/phase-5-roadmap.md` and `docs/implementation-playbook.md`'s Definition of Done. Extended in Phase 6 per the Founder's Testing Directive and `docs/engineering-principles.md` QGR-006.

## Structure

```text
tests/
├── helpers/
│   └── mock-supabase-client.ts   Shared mocked PostgREST client builder
├── unit/
│   ├── auth/                     Session/Role resolver (Step 3)
│   ├── identity/                 Profile reads (Step 4)
│   ├── governance/                Feature flags / configuration (Step 5)
│   ├── campaign/                  Campaign lifecycle (Step 6)
│   ├── discovery/                 Discovery summary reads (Step 7)
│   ├── protection/                 Exclusion visibility (Step 8)
│   ├── intelligence/               Badges/reputation/bonuses (Step 9)
│   ├── analytics/                  Platform/community dashboards (Step 10)
│   ├── payment/                    Wallet reads (Step 12)
│   ├── notification/               Event-to-content mapping (Step 11)
│   ├── jobs/                       Notification dispatch job (Step 11)
│   ├── creator/                    Cross-domain dashboard reader (Step 13)
│   ├── config/                     Server Component session reader (Step 13)
│   └── api/                        _lib modules in isolation (EWP-001)
├── integration/
│   └── api/                       One file per API route, full HTTP
│                                   request lifecycle (Phase 6 Testing
│                                   Directive, QGR-006) -- see its own
│                                   README.md
├── security/
│   ├── api-schema-grants.test.ts        Static REVOKE/GRANT verification
│   └── live-verification-queries.sql    Manual, for a live database
└── uat-checklist.md               Manual user-acceptance checklist
```

Run with `npm test` (Jest, via `next/jest`).

## Two things both called "integration," disambiguated

Phase 5 and Phase 6 each introduced a test category informally described as "integration," and they are not the same thing:

```text
Service-to-client integration (Phase 5, lives under tests/unit/*):
  A domain service function called against a mocked Supabase client,
  confirming it calls the correct schema/table/rpc with the correct
  arguments. Physically located alongside each domain's unit tests,
  not in a separate folder.

Route-to-dependencies integration (Phase 6, tests/integration/api/):
  A real API route handler called with a real-shaped Request, mocking
  only true external boundaries (authenticate(), the domain service),
  asserting on the actual Response returned. One file per route.
```

## Honest scope limitations

No live Supabase/Postgres project exists in this development environment. This shapes what these suites can and cannot claim:

```text
Unit tests:          Real, executed (not just type-checked) --
                      every domain service's mapping/error-handling
                      logic, and every API _lib module, is exercised
                      directly.

Service integration:  Mocked-client integration (service -> mocked
                      Supabase client boundary), not live-database
                      integration -- see above.

Route integration:    Mocked-dependency integration (route -> mocked
                      auth/service boundary), not a live HTTP server
                      or a live database -- see above.

Security tests:      One static, executed test (REVOKE precedes
                      GRANT in the actual migration file). The live
                      pg_proc/RLS verification queries this static
                      test cannot replace are in
                      live-verification-queries.sql, not executed here.

Performance tests:   Not implemented -- no live environment to
                      benchmark against. Deferred, not fabricated.

User acceptance:      Not automatable. tests/uat-checklist.md is a
                      manual checklist mapped to each dashboard's
                      Step 13 exit criteria, for a human reviewer
                      against a running instance.
```
