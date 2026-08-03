'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { NotificationBell } from '@/components/notification-bell';
import { DashboardAccountMenu } from '@/components/dashboard/dashboard-account-menu';
import { MarketingImage } from '@/components/marketing-image';

/**
 * Shared chrome for client-facing pages outside `/dashboard/*`
 * (privacy, terms, guest contact) so header/menu/footer match the app.
 */
export function ClientAppShell({
  children,
  loginRedirectTo = '/dashboard',
}: {
  children: ReactNode;
  loginRedirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f1ec]">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href={user ? '/dashboard' : '/'}
            className="flex min-w-0 items-center gap-1.5 sm:gap-2.5"
            aria-label="Fotomatic home"
          >
            <MarketingImage
              file="fotomaticLogo.png"
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 shrink-0 object-contain"
            />
            <MarketingImage
              file="fotomatic.jpg"
              alt="Fotomatic"
              width={140}
              height={32}
              className="h-5 w-auto max-w-[110px] object-contain object-left sm:h-6 sm:max-w-[140px]"
            />
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!loading && user ? (
              <>
                <NotificationBell />
                <DashboardAccountMenu />
              </>
            ) : !loading ? (
              <button
                type="button"
                onClick={() => openLoginModal({ redirectTo: loginRedirectTo })}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Log in
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="w-full flex-1">{children}</main>

      <footer className="mt-auto border-t border-zinc-200/70 bg-[#faf8f5] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-zinc-400 sm:text-sm">
            <Link
              href="/privacy"
              className="transition-colors hover:text-zinc-600"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-zinc-600"
            >
              Terms &amp; conditions
            </Link>
            <Link
              href="/dashboard/contact"
              className="transition-colors hover:text-zinc-600"
            >
              Contact support
            </Link>
          </nav>
          <p className="text-xs font-medium text-zinc-600">© Fotomatic 2026</p>
        </div>
      </footer>
    </div>
  );
}
