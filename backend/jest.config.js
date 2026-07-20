const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/**
 * Default config: tests/unit/ and tests/integration/api/ only --
 * mocked-client tests, no real database. tests/live/ (real
 * Supabase/PostgreSQL) and tests/e2e/ (staging-only) are explicitly
 * excluded here and run via their own separate configs/scripts
 * (`npm run test:live`), per docs/phase-7-charter.md's Testing
 * Architecture section (EWP-008) -- so a plain `npm test` never
 * attempts a real database connection.
 */
/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/tests/live/', '<rootDir>/tests/e2e/'],
};

module.exports = createJestConfig(customJestConfig);
