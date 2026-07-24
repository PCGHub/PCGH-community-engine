/**
 * Real (not mocked) tests for getPublicEnv() (EWP-011 corrective
 * patch). These prove the validation logic itself -- present values
 * are returned, missing values throw a clear error -- but they
 * CANNOT prove the specific defect this patch actually fixed.
 *
 * Jest runs this code directly in Node.js; it never performs Next.js's
 * webpack-based build-time client-bundle inlining step, so
 * process.env.X and process.env[name] are indistinguishable to Jest
 * -- both are ordinary runtime lookups here. The incident this patch
 * addresses (dynamic process.env[name] access is never statically
 * inlined into the browser bundle, so NEXT_PUBLIC_ values silently
 * resolve to undefined client-side regardless of correct hosting
 * configuration) can only be caught by a real `next build` followed
 * by an actual deployed-bundle browser check -- not by any unit test
 * in this suite. This test still has real value: it guards the
 * validation logic itself (throwing on missing values, returning
 * correct values when present) against regression.
 */

import { getPublicEnv } from '../../../app/config/env';

describe('getPublicEnv', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    if (originalUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    }
    if (originalAnonKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
    }
  });

  it('returns the real values when both variables are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.test';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-value';

    expect(getPublicEnv()).toEqual({
      supabaseUrl: 'https://example.test',
      supabaseAnonKey: 'anon-key-value',
    });
  });

  it('throws a clear error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-value';

    expect(() => getPublicEnv()).toThrow('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
  });

  it('throws a clear error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.test';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => getPublicEnv()).toThrow('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });
});
