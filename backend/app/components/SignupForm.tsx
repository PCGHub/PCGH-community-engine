'use client';

/**
 * Signup form (EWP-011) -- the first genuinely interactive Client
 * Component in this codebase (every existing dashboard is read-only,
 * per docs/frontend-architecture.md Section 8). Calls Supabase Auth
 * directly via the browser client; does not go through the backend's
 * Bearer-token API layer (app/auth/) at all.
 *
 * Redirects to /community on a real authenticated session; shows a
 * neutral "check your email" state if signup succeeded but email
 * confirmation is required (never treats that as logged in).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../config/supabase-browser';
import { performSignup, isValidUsernameShape } from '../services/auth/auth-service';
import { FormField } from './FormField';
import { useUsernameAvailability } from './useUsernameAvailability';

const AVAILABILITY_HINT: Record<string, string | undefined> = {
  idle: undefined,
  checking: 'Checking availability...',
  available: 'Username available',
  taken: 'Username already taken',
};

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { availability, checkNow } = useUsernameAvailability(username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidUsernameShape(username)) {
      setError('Please enter a username.');
      return;
    }

    setSubmitting(true);
    setError(undefined);

    const result = await performSignup(getSupabaseBrowserClient(), {
      email,
      password,
      username,
      emailRedirectTo: `${window.location.origin}/login`,
    });

    setSubmitting(false);
    if (result.status === 'error') {
      setError(result.message);
    } else if (result.status === 'confirmation_required') {
      setConfirmationRequired(true);
    } else {
      router.push('/community');
    }
  }

  if (confirmationRequired) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        Check your email to confirm your account before signing in.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onBlur={checkNow}
        hint={AVAILABILITY_HINT[availability]}
        required
      />
      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <FormField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="mb-4 text-sm text-gray-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900"
      >
        {submitting ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
