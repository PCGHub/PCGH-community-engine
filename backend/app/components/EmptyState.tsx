/**
 * Reusable empty/unauthorized state, shared across every dashboard, per
 * CLAUDE.md's Frontend rule ("Reusable components. No duplicated UI.").
 *
 * Used when a view legitimately returns no rows for the current
 * session (no session, non-admin viewing an admin-only view, RLS
 * filtering to nothing) -- per Step 13's exit criteria, this must be
 * rendered as-is, never patched over with a direct table query or a
 * hardcoded fallback value.
 */
export function EmptyState({ message }: { message: string }) {
  return <p className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">{message}</p>;
}
