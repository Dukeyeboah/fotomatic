'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  CreditCard,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MessageCircle,
  PanelLeftClose,
  PanelLeft,
  Search,
  Settings,
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: CalendarCheck },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/saved', label: 'Saved Photographers', icon: Heart },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Account Settings', icon: Settings },
] as const;

export function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  mobileOpen,
  messagesUnreadCount = 0,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  mobileOpen: boolean;
  messagesUnreadCount?: number;
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
              href="/dashboard"
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
              href="/dashboard"
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
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === href || pathname.startsWith(`${href}/`);
            const showMsgBadge =
              href === '/dashboard/messages' && messagesUnreadCount > 0;
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
                {!collapsed ? (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span>{label}</span>
                    {showMsgBadge ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {messagesUnreadCount > 99
                          ? '99+'
                          : messagesUnreadCount}
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {collapsed && showMsgBadge ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-white">
                    {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {!collapsed ? (
          <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-900/5">
            <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100">
              <Image
                src="/fotomaticImages/fotomatic0.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
            <p className="text-xs font-medium leading-snug text-zinc-800">
              Book the perfect photographer for your special moments.
            </p>
            <Link
              href="/dashboard/photographers"
              onClick={onNavigate}
              className="mt-3 flex w-full items-center justify-center rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800"
            >
              Find Photographers
            </Link>
          </div>
        ) : (
          <div className="mx-auto mb-3">
            <Link
              href="/dashboard/photographers"
              title="Find Photographers"
              onClick={onNavigate}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <Search className="h-5 w-5" />
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
                Contact Support
              </Link>
            </>
          ) : (
            <Link
              href="/contact"
              title="Contact Support"
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
