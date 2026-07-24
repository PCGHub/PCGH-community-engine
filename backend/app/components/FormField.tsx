/**
 * Shared form field primitive (EWP-011) -- reused by SignupForm and
 * LoginForm, per CLAUDE.md's "Reusable components. No duplicated UI."
 * Matches the existing Tailwind conventions already established by
 * DashboardShell/StatCard/EmptyState (docs/frontend-architecture.md
 * Section 6).
 */

import type { InputHTMLAttributes } from 'react';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function FormField({ label, hint, ...inputProps }: FormFieldProps) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-medium text-gray-900">{label}</span>
      <input
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        {...inputProps}
      />
      {hint && <span className="mt-1 block text-sm text-gray-500">{hint}</span>}
    </label>
  );
}
