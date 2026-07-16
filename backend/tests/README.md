# backend/tests/

Phase 5 Step 14 (Testing) test suite, per `docs/phase-5-roadmap.md` and `docs/implementation-playbook.md`'s Definition of Done.

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
│   └── jobs/                       Notification dispatch job (Step 11)
├── security/
│   ├── api-schema-grants.test.ts        Static REVOKE/GRANT verification
│   └── live-verification-queries.sql    Manual, for a live database
└── uat-checklist.md               Manual user-acceptance checklist
```

Run with `npm test` (Jest, via `next/jest`).

## Honest scope limitations

No live Supabase/Postgres project exists in this development environment. This shapes what these suites can and cannot claim:

```text
Unit tests:          Real, executed (not just type-checked) --
                      every domain service's mapping/error-handling
                      logic is exercised against a mocked PostgREST
                      client.

Integration tests:   Mocked-client integration (service -> mocked
                      Supabase client boundary), not live-database
                      integration. Confirms each service calls the
                      correct schema/table/rpc with the correct
                      arguments; does not confirm the live database
                      actually responds that way.

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
