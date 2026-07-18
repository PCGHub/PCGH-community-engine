# tests/integration/api/

Per the Founder's Phase 6 Testing Directive and `docs/engineering-principles.md` QGR-006: one integration test file per API route, exercising the complete HTTP request lifecycle — the real route handler, called with a real-shaped `Request`, mocking only true external boundaries (`authenticate()`, the domain service function it calls), asserting on the actual `Response` (status, envelope shape).

Distinct from `tests/unit/api/`, which covers individual `_lib` modules (`response.ts`, `errors.ts`, `validation.ts`, `handler.ts`) in isolation. A route needs both: unit tests for any new logic it introduces, and exactly one integration test here — required as part of the same work package that ships the route, never deferred.
