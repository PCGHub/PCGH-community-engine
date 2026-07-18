# tests/integration/api/discovery/

EWP-003. One file per Discovery API route, per `../README.md`'s convention: `list`, `get` — matching `backend/app/api/v1/discovery/` exactly. Both routes are read-only; neither exercises the TD-005 error classifier (`app/api/_lib/errors.ts`), since the underlying service functions return `null` on a missing/RLS-invisible row rather than throwing.
