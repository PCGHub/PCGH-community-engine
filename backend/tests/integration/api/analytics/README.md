# tests/integration/api/analytics/

EWP-005. One file per Analytics API route, per `../README.md`'s convention: `platform`, `list`, `get` -- matching `backend/app/api/v1/analytics/` exactly. `platform.test.ts` asserts the 404 body carries no distinguishing message between "no data" and "unauthorized" -- the non-disclosure semantic documented in `platform/route.ts`'s own header comment.
