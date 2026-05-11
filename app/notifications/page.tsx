'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { NotificationsView } from '@/components/notifications-view';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Signed-in users are routed to role-specific notification pages.
 * Guests can open this URL and will be prompted to log in from the view.
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
      return;
    }
    router.replace('/dashboard/notifications');
  }, [loading, user, userData, router]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <NotificationsView
          threadMessagesBaseHref="/messages"
          loginRedirectTo="/notifications"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    </div>
  );
}
