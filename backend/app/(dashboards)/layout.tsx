import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Dashboard Layout, per docs/frontend-architecture.md Section 1
 * (Layout Hierarchy). Implements the Navigation Strategy principles in
 * Section 2: one entry point per dashboard (Section 3's Dashboard
 * Ownership), structural chrome only -- no data-fetching, no session
 * resolution, no role-based hiding (every link is presented to every
 * viewer; each destination page owns its own RLS-driven empty/
 * unauthorized state).
 *
 * A route group (the parens in the folder name) -- it changes no URL
 * path, it only lets these four routes share this layout without
 * forcing every future route through the same chrome.
 */

const DASHBOARD_LINKS = [
  { href: '/admin', label: 'Admin' },
  { href: '/creator', label: 'Creator' },
  { href: '/community', label: 'Community' },
  { href: '/analytics', label: 'Analytics' },
] as const;

export default function DashboardsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <ul className="mx-auto flex max-w-5xl gap-6 px-6 py-4 text-sm font-medium text-gray-600">
          {DASHBOARD_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-gray-900">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
