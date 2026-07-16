/**
 * Reusable metric display, shared across every dashboard, per
 * CLAUDE.md's Frontend rule ("Reusable components. No duplicated UI.").
 *
 * `value === null` renders as an explicit "Not available" label rather
 * than 0 or blank -- per docs/implementation-playbook.md's Frontend
 * Rules, an RLS-restricted/NULL field must be shown as a legitimate
 * empty state, never patched over with a fallback value.
 */
export function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value === null ? 'Not available' : value}</div>
    </div>
  );
}
