const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/**
 * Live-database config (EWP-008). Targets tests/live/ only -- real
 * Supabase/PostgreSQL integration, RLS, trigger, and concurrency
 * tests, per docs/phase-7-charter.md's Testing Architecture section.
 * Never matches tests/e2e/ (staging-only, wired up by its own owning
 * EWP-019, not this one) and never runs as part of the default
 * `npm test` (see jest.config.js's testPathIgnorePatterns).
 *
 * Requires a real Postgres/Supabase Auth/PostgREST stack already
 * running (`npm run supabase:start`, or the staging project once
 * EWP-009 exists) and TEST_SUPABASE_* environment variables set --
 * see tests/helpers/live-supabase-client.ts, which fails closed
 * (throws) rather than falling back to any other Supabase target if
 * those are missing.
 */
/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/live/**/*.test.ts'],
};

module.exports = createJestConfig(customJestConfig);
