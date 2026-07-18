# tests/integration/api/intelligence/

EWP-006 -- Intelligence Badge Catalog API. One file for this domain's single exposed route, per `../README.md`'s convention: `list` -- matching `backend/app/api/v1/intelligence/badges/route.ts`. This is deliberately the entire Intelligence Domain surface exposed so far; `getReputationLeaderboard`, `awardBadge`/`revokeBadge`, the reputation recalculation functions, and `createPerformanceBonus` remain unexposed and untested here on purpose.
