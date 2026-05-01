'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Loader2, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { NotificationBell } from '@/components/notification-bell';
import { DashboardMessagesNavLink } from '@/components/dashboard/messages-nav-link';
import { PhotographerSidebar } from '@/components/photographer/photographer-sidebar';
import { PhotographerWelcomeHeader } from '@/components/photographer/photographer-welcome-header';
import { PhotographerAccountMenu } from '@/components/photographer/photographer-account-menu';

const COLLAPSE_KEY = 'fotomatic_photographer_sidebar_collapsed';

function photographerFirstName(
  userData: ReturnType<typeof useAuth>['userData'],
  displayName: string | null,
  email: string | null,
): string {
  const raw =
    userData?.displayName?.trim() ||
    displayName?.trim() ||
    email?.split('@')[0] ||
    'there';
  return raw.split(/\s+/)[0] || 'there';
}

export function PhotographerLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    if (loading || !user || !userData) return;
    if (userData.role !== 'photographer') {
      router.replace('/dashboard');
    }
  }, [loading, user, userData, router]);

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
          Sign in with your photographer account to continue.
        </p>
        <button
          type="button"
          onClick={() => openLoginModal({ redirectTo: '/photographer' })}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Log in
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (userData && userData.role !== 'photographer') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  const greet = photographerFirstName(
    userData,
    user.displayName,
    user.email,
  );

  return (
    <div className="flex min-h-screen bg-[#f4f1ec]">
      <PhotographerSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onNavigate={closeMobile}
        mobileOpen={mobileOpen}
      />
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 shrink-0 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="inline-flex rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden min-w-0 flex-1 lg:block">
              <PhotographerWelcomeHeader firstName={greet} />
            </div>
            <div className="flex flex-1 justify-end gap-2 sm:gap-3 lg:flex-initial">
              <NotificationBell />
              <DashboardMessagesNavLink href="/photographer/messages" />
              <PhotographerAccountMenu />
            </div>
          </div>
          <div className="border-t border-zinc-100 px-4 py-4 lg:hidden">
            <PhotographerWelcomeHeader firstName={greet} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
