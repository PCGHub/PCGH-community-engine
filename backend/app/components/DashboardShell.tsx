import type { ReactNode } from 'react';

/**
 * Shared page shell for every Phase 5 Step 13 dashboard, per
 * CLAUDE.md's Frontend rule ("Reusable components. No duplicated UI.").
 */
export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-gray-900">{title}</h1>
      {children}
    </main>
  );
}
