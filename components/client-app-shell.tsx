'use client';

import type { ReactNode } from 'react';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';

/**
 * Shared chrome for client-facing pages (privacy, terms, photographers,
 * contact, and authenticated client routes).
 */
export function ClientAppShell({
  children,
  loginRedirectTo = '/photographers',
  allowGuest = true,
  skipRoleRedirect = true,
}: {
  children: ReactNode;
  loginRedirectTo?: string;
  allowGuest?: boolean;
  skipRoleRedirect?: boolean;
}) {
  return (
    <DashboardLayoutClient
      allowGuest={allowGuest}
      skipRoleRedirect={skipRoleRedirect}
      loginRedirectTo={loginRedirectTo}
    >
      {children}
    </DashboardLayoutClient>
  );
}
