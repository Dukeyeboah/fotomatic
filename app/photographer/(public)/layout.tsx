import type { ReactNode } from 'react';

/** Route group for `/photographer/[slug]` — shell (header vs dashboard) comes from the page. */
export default function PhotographerPublicGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
