import type { ReactNode } from 'react';
import { PhotographerLayoutClient } from '@/components/photographer/photographer-layout-client';

export default function PhotographerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PhotographerLayoutClient>{children}</PhotographerLayoutClient>;
}
