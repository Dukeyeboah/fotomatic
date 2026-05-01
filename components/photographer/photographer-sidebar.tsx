'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  CalendarCheck,
  CircleDollarSign,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  MessageCircle,
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  Star,
  UserRound,
} from 'lucide-react';
import { MOCK_SIDEBAR_BADGES } from '@/lib/photographer-dashboard-mock';

const nav: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}> = [
  { href: '/photographer', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/photographer/requests',
    label: 'Requests',
    icon: Search,
    badge: MOCK_SIDEBAR_BADGES.requests,
  },
  { href: '/photographer/bookings', label: 'Bookings', icon: CalendarCheck },
  {
    href: '/photographer/messages',
    label: 'Messages',
    icon: MessageCircle,
    badge: MOCK_SIDEBAR_BADGES.messages,
  },
  { href: '/photographer/calendar', label: 'Calendar', icon: Calendar },
  { href: '/photographer/earnings', label: 'Earnings', icon: CircleDollarSign },
  { href: '/photographer/reviews', label: 'Reviews', icon: Star },
  { href: '/photographer/profile', label: 'Profile', icon: UserRound },
  { href: '/photographer/settings', label: 'Settings', icon: Settings },
];

export function PhotographerSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  mobileOpen,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  mobileOpen: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm lg:hidden',
          mobileOpen ? 'block' : 'hidden',
        ].join(' ')}
        aria-hidden
        onClick={onNavigate}
      />
      <aside
        className={[
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-zinc-200 bg-[#faf8f5] transition-[width,transform] duration-200 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'w-[72px] lg:w-[72px]' : 'w-64',
        ].join(' ')}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-zinc-200/80 px-3 lg:px-4">
          {!collapsed ? (
            <Link
              href="/photographer"
              className="flex min-w-0 items-center gap-2"
              onClick={onNavigate}
            >
              <Image
                src="/fotomaticImages/fotomaticLogo.png"
                alt=""
                width={36}
                height={36}
                className="h-8 w-8 shrink-0 object-contain"
              />
              <Image
                src="/fotomaticImages/fotomatic.jpg"
                alt="Fotomatic"
                width={120}
                height={32}
                className="h-6 w-auto max-w-[100px] object-contain object-left"
              />
            </Link>
          ) : (
            <Link
              href="/photographer"
              className="mx-auto flex justify-center"
              onClick={onNavigate}
            >
              <Image
                src="/fotomaticImages/fotomaticLogo.png"
                alt="Home"
                width={36}
                height={36}
                className="h-8 w-8 object-contain"
              />
            </Link>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-900 lg:inline-flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        {!collapsed ? (
          <p className="px-4 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Capture your moments
          </p>
        ) : (
          <div className="h-2" />
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {nav.map(({ href, label, icon: Icon, badge }) => {
            const active =
              href === '/photographer'
                ? pathname === '/photographer'
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                onClick={onNavigate}
                className={[
                  'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#e8dfd2] text-zinc-900 shadow-sm ring-1 ring-zinc-900/5'
                    : 'text-zinc-600 hover:bg-white/80 hover:text-zinc-900',
                  collapsed ? 'justify-center px-0' : '',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                {!collapsed ? <span>{label}</span> : null}
                {badge != null && badge > 0 ? (
                  <span
                    className={[
                      'inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white',
                      collapsed
                        ? 'absolute -right-0.5 -top-0.5'
                        : 'ml-auto',
                    ].join(' ')}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {!collapsed ? (
          <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-zinc-900 p-3 text-white shadow-lg ring-1 ring-zinc-900/20">
            <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-zinc-800">
              <Image
                src="/fotomaticImages/fotomatic1.jpg"
                alt=""
                fill
                className="object-cover opacity-90"
                sizes="200px"
              />
            </div>
            <p className="text-xs font-medium leading-snug text-zinc-100">
              Share your work. Grow your business.
            </p>
            <Link
              href="/profile"
              onClick={onNavigate}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
            >
              View My Profile
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mx-auto mb-3">
            <Link
              href="/profile"
              title="View My Profile"
              onClick={onNavigate}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <UserRound className="h-5 w-5" />
            </Link>
          </div>
        )}

        <div className="mt-auto border-t border-zinc-200/80 px-4 py-4">
          {!collapsed ? (
            <>
              <p className="text-xs font-semibold text-zinc-800">Need help?</p>
              <Link
                href="/contact"
                onClick={onNavigate}
                className="mt-1 text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
              >
                Visit our Help Center
              </Link>
            </>
          ) : (
            <Link
              href="/contact"
              title="Help Center"
              onClick={onNavigate}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-white/80"
            >
              <HelpCircle className="h-5 w-5" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
