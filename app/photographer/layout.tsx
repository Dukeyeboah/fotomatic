import type { ReactNode } from 'react';

/** Passthrough: `(app)` uses the dashboard shell; `(public)` uses its own layout. */
export default function PhotographerSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
