# tests/integration/api/identity/

EWP-007 -- Identity Profile API. One file for this domain's single route, per `../README.md`'s convention: `get` -- matching `backend/app/api/v1/identity/profile/route.ts`. Includes an explicit test proving a request-supplied `userId` query parameter is ignored -- identity is always resolved from the authenticated session, never from request input.
