'use client';

import Link from 'next/link';
import { type ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { NotificationBell } from '@/components/notification-bell';
import { PhotographerAccountMenu } from '@/components/photographer/photographer-account-menu';
import { PhotographerProfileSetupModal } from '@/components/photographer-profile-setup-modal';
import { PhotographerBookingThreadsProvider } from '@/contexts/PhotographerBookingThreadsContext';
import { MarketingImage } from '@/components/marketing-image';
import { syncPhotographerPublicDirectory } from '@/lib/firebase/sync-photographer-directory';

export function PhotographerLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role !== 'photographer') {
      router.replace('/photographers');
    }
  }, [loading, user, userData, router]);

  /** Keep `photographers` in sync with `users` after login or refresh. */
  useEffect(() => {
    if (!user || !userData || userData.role !== 'photographer') return;
    let cancelled = false;
    (async () => {
      const ok = await syncPhotographerPublicDirectory(
        { ...userData, uid: userData.uid ?? user.uid },
        user.uid,
      );
      if (!ok && !cancelled) {
        console.warn(
          'Fotomatic: directory sync failed (check Firestore rules and network).',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, userData]);

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

  if (!userData || userData.role !== 'photographer') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <PhotographerBookingThreadsProvider>
      <div className="flex min-h-[100dvh] flex-col bg-[#f4f1ec]">
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link
              href="/photographer"
              className="flex min-w-0 items-center gap-1.5 sm:gap-2.5"
              aria-label="Fotomatic photographer home"
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
              <NotificationBell />
              <PhotographerAccountMenu />
            </div>
          </div>
        </header>

        <main className="flex w-full flex-1 flex-col pb-24">{children}</main>

        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200/70 bg-[#faf8f5]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
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
                href="/photographer/contact"
                className="transition-colors hover:text-zinc-600"
              >
                Contact support
              </Link>
            </nav>
            <p className="text-xs font-medium text-zinc-600">© Fotomatic 2026</p>
          </div>
        </footer>

        <PhotographerProfileSetupModal />
      </div>
    </PhotographerBookingThreadsProvider>
  );
}
