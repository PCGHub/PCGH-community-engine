# tests/e2e/

Reserved by EWP-008 (Phase 7); not wired up yet. The single scripted critical-journey walkthrough (`docs/phase-7-charter.md`'s Critical End-to-End MVP Journey) belongs here, run only against the real staging project (EWP-009), never against the local/CI stack `tests/live/` uses. Its runner/config is deliberately not created by EWP-008 -- wiring a runner for an environment that doesn't exist yet would be premature -- and is instead a deliverable of EWP-019, once staging is actually available to target.

Excluded from both the default `npm test` (`jest.config.js`'s `testPathIgnorePatterns`) and from `npm run test:live` (`jest.live.config.js`'s `testMatch` targets `tests/live/` only, never this directory).
