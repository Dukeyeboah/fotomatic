'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, Menu, X } from 'lucide-react';

const ADMIN_SIDEBAR_COLLAPSED_KEY = 'fotomatic_admin_sidebar_collapsed';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export function AdminLayoutClient({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === '1') {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, user, userData, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100 px-4">
        <p className="text-center text-zinc-700">Sign in to access admin.</p>
        <button
          type="button"
          onClick={() => openLoginModal({ redirectTo: '/admin' })}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Log in
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (userData.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <div
        className={[
          'fixed inset-0 z-40 bg-zinc-950/60 lg:hidden',
          mobileNav ? 'block' : 'hidden',
        ].join(' ')}
        aria-hidden
        onClick={() => setMobileNav(false)}
      />
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 lg:static',
          mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onNavigate={() => setMobileNav(false)}
        />
      </div>
      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-950 px-3 py-2 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-100 hover:bg-zinc-800"
            aria-label="Open menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold text-zinc-100">Admin</span>
          {mobileNav ? (
            <button
              type="button"
              className="ml-auto rounded-lg p-2 text-zinc-100"
              aria-label="Close menu"
              onClick={() => setMobileNav(false)}
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
