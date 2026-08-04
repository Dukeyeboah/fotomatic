'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';
import { NotificationsView } from '@/components/notifications-view';

/**
 * Role-aware notifications entry. Clients use the shared client shell;
 * photographers and admins are sent to their inboxes.
 */
export default function NotificationsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role === 'admin') {
      router.replace('/admin/notifications');
      return;
    }
    if (userData.role === 'photographer') {
      router.replace('/photographer/notifications');
    }
  }, [loading, user, userData, router]);

  if (loading || (user && !userData)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1ec]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (
    user &&
    (userData?.role === 'admin' || userData?.role === 'photographer')
  ) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1ec]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <DashboardLayoutClient
      allowGuest
      loginRedirectTo="/notifications"
    >
      <NotificationsView
        threadMessagesBaseHref="/messages"
        loginRedirectTo="/notifications"
      />
    </DashboardLayoutClient>
  );
}
