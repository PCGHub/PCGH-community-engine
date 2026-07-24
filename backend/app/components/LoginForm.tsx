'use client';

/**
 * Login form (EWP-011). Calls Supabase Auth directly via the browser
 * client; redirects to /community on a real authenticated session.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '../config/supabase-browser';
import { performLogin } from '../services/auth/auth-service';
import { FormField } from './FormField';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(undefined);

    const result = await performLogin(getSupabaseBrowserClient(), { email, password });

    setSubmitting(false);
    if (result.status === 'error') {
      setError(result.message);
    } else {
      router.push('/community');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
        {submitting ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
