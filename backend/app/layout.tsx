import type { ReactNode } from 'react';
import './globals.css';

/**
 * Root layout. Required by Next.js App Router. Loads Tailwind
 * (docs/implementation-playbook.md, "Frontend Rules") for the Phase 5
 * Step 13 dashboards; still no business logic of its own.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
