'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { AccountMenuDropdown } from '@/components/account-menu-dropdown';
import { DashboardAccountMenu } from '@/components/dashboard/dashboard-account-menu';
import { PhotographerAccountMenu } from '@/components/photographer/photographer-account-menu';
import { NotificationBell } from '@/components/notification-bell';
import { MarketingImage } from '@/components/marketing-image';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const pathname = usePathname();
  const isBackoffice =
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/photo-admin' ||
    pathname.startsWith('/photo-admin/');
  const isAdmin = userData?.role === 'admin';
  const isPhotographer = userData?.role === 'photographer';
  const isClient = userData?.role === 'user';
  const showMarketingNav = pathname === '/' && !isBackoffice && !isAdmin;
  const logoHref =
    user && !isBackoffice
      ? isAdmin
        ? '/admin'
        : isPhotographer
          ? '/photographer'
          : '/dashboard'
      : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href={logoHref}
          className="flex min-w-0 shrink items-center gap-1.5 sm:gap-3"
          aria-label="Fotomatic home"
        >
          <MarketingImage
            file="fotomaticLogo.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-7 w-7 shrink-0 object-contain sm:h-9 sm:w-9"
          />
          <MarketingImage
            file="fotomatic.jpg"
            alt="Fotomatic"
            width={160}
            height={40}
            priority
            className="h-5 w-auto max-w-[108px] object-contain object-left sm:h-7 sm:max-w-[180px]"
          />
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-sm font-medium text-zinc-700 sm:gap-4">
          {showMarketingNav ? (
            <div className="hidden items-center gap-4 sm:flex">
              <Link href="/#how-it-works" className="hover:text-zinc-900">
                How it works
              </Link>
              <Link href="/photographers" className="hover:text-zinc-900">
                Photographers
              </Link>
            </div>
          ) : null}
          {!loading &&
            (user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                {isClient ? (
                  <DashboardAccountMenu />
                ) : isPhotographer ? (
                  <PhotographerAccountMenu />
                ) : (
                  <AccountMenuDropdown />
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal()}
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
              >
                Log in
              </button>
            ))}
        </nav>
      </div>
    </header>
  );
}
