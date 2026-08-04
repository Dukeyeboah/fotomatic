'use client';

import Link from 'next/link';
import { type ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { NotificationBell } from '@/components/notification-bell';
import { DashboardAccountMenu } from '@/components/dashboard/dashboard-account-menu';
import { PhotographerAccountMenu } from '@/components/photographer/photographer-account-menu';
import { AccountMenuDropdown } from '@/components/account-menu-dropdown';
import { DashboardApplyPhotographerProvider } from '@/components/dashboard/dashboard-apply-photographer-context';
import { MarketingImage } from '@/components/marketing-image';

export function DashboardLayoutClient({
  children,
  embedPublicProfile = false,
  allowGuest = false,
  skipRoleRedirect = false,
  loginRedirectTo = '/photographers',
}: {
  children: ReactNode;
  /** When true, do not redirect photographers/admins away (e.g. viewing another photographer’s public page). */
  embedPublicProfile?: boolean;
  /** When true, guests see the shell + login instead of a blocking gate. */
  allowGuest?: boolean;
  /** When true, keep photographers/admins on this page (privacy, terms, etc.). */
  skipRoleRedirect?: boolean;
  loginRedirectTo?: string;
}) {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();

  useEffect(() => {
    if (embedPublicProfile || skipRoleRedirect) return;
    if (loading || !user || !userData) return;
    if (userData.role === 'admin') {
      router.replace('/admin');
    } else if (userData.role === 'photographer') {
      router.replace('/photographer');
    }
  }, [
    embedPublicProfile,
    skipRoleRedirect,
    loading,
    user,
    userData,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!user && !allowGuest) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf8f5] px-4">
        <p className="text-center text-zinc-700">Sign in to continue.</p>
        <button
          type="button"
          onClick={() => openLoginModal({ redirectTo: loginRedirectTo })}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Log in
        </button>
      </div>
    );
  }

  if (
    !embedPublicProfile &&
    !skipRoleRedirect &&
    user &&
    (userData?.role === 'photographer' || userData?.role === 'admin')
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  const logoHref = user
    ? userData?.role === 'photographer'
      ? '/photographer'
      : userData?.role === 'admin'
        ? '/admin'
        : '/photographers'
    : '/';

  const accountMenu =
    userData?.role === 'photographer' ? (
      <PhotographerAccountMenu />
    ) : userData?.role === 'admin' ? (
      <AccountMenuDropdown />
    ) : user ? (
      <DashboardAccountMenu />
    ) : null;

  return (
    <DashboardApplyPhotographerProvider>
      <div className="flex min-h-[100dvh] flex-col bg-[#f4f1ec]">
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 pt-[max(0px,env(safe-area-inset-top))] backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link
              href={logoHref}
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
                  {accountMenu}
                </>
              ) : !loading ? (
                <button
                  type="button"
                  onClick={() =>
                    openLoginModal({ redirectTo: loginRedirectTo })
                  }
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Log in
                </button>
              ) : null}
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
                href={
                  userData?.role === 'photographer'
                    ? '/photographer/contact'
                    : '/contact'
                }
                className="transition-colors hover:text-zinc-600"
              >
                Contact support
              </Link>
            </nav>
            <p className="text-xs font-medium text-zinc-600">© Fotomatic 2026</p>
          </div>
        </footer>
      </div>
    </DashboardApplyPhotographerProvider>
  );
}
