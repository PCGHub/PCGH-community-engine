/**
 * Minimal, chrome-free layout for the (auth) route group (EWP-011) --
 * deliberately bypasses DashboardShell's nav, per
 * docs/frontend-architecture.md Section 1's own forward-reference to
 * "a future login page" not being forced through dashboard chrome.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-sm px-6 py-16">{children}</main>;
}
