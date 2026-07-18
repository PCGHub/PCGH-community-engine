# tests/integration/api/protection/

EWP-004. One file for Protection API's single route, per `../README.md`'s convention: `list` -- matching `backend/app/api/v1/protection/exclusions/route.ts`. Includes an explicit assertion that no `cooldown`/`cooldownUntil` field appears on any returned item, proving the route does not reintroduce what `listOwnExclusions()` deliberately omits pending ADR-013.
