'use client';

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Loader2, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { NotificationBell } from '@/components/notification-bell';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { DashboardAccountMenu } from '@/components/dashboard/dashboard-account-menu';
import { subscribeThreadsForClient } from '@/lib/firebase/booking-threads';

const COLLAPSE_KEY = 'fotomatic_dashboard_sidebar_collapsed';

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messagesUnread, setMessagesUnread] = useState(0);

  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role === 'admin') {
      router.replace('/admin');
    } else if (userData.role === 'photographer') {
      router.replace('/photographer');
    }
  }, [loading, user, userData, router]);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(COLLAPSE_KEY);
      if (v === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!user) {
      setMessagesUnread(0);
      return;
    }
    return subscribeThreadsForClient(user.uid, (threads) => {
      const n = threads.reduce(
        (acc, t) => acc + (t.unreadByClientCount ?? 0),
        0,
      );
      setMessagesUnread(n);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf8f5] px-4">
        <p className="text-center text-zinc-700">
          Sign in to open your dashboard.
        </p>
        <button
          type="button"
          onClick={() =>
            openLoginModal({ redirectTo: '/dashboard' })
          }
          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Log in
        </button>
      </div>
    );
  }

  if (userData?.role === 'photographer' || userData?.role === 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f1ec]">
      <DashboardSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onNavigate={closeMobile}
        mobileOpen={mobileOpen}
        messagesUnreadCount={messagesUnread}
      />
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-end gap-2 sm:gap-3">
            <NotificationBell />
            {/* Messages live in the sidebar; keep header minimal */}
            <DashboardAccountMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
