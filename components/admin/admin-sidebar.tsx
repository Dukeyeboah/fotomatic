'use client';

import Link from 'next/link';
import { MarketingImage } from '@/components/marketing-image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeAdminInboxCounts } from '@/lib/firebase/admin-inbox';
import {
  LayoutDashboard,
  Users,
  Camera,
  CalendarCheck,
  MessageSquare,
  Bell,
  SlidersHorizontal,
  Inbox,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { subscribeUnreadNotificationCount } from '@/lib/firebase/booking-threads';
import { subscribeUnreadAdminEventCount } from '@/lib/firebase/admin';

const mainNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell, end: false },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare, end: false },
  { href: '/admin/photographers', label: 'Photographers', icon: Camera, end: false },
  {
    href: '/admin/inbox',
    label: 'Applications',
    icon: Inbox,
    end: false,
  },
  { href: '/admin/users', label: 'Users', icon: Users, end: false },
] as const;

const settingsNav = [
  {
    href: '/admin/settings/system',
    label: 'System Settings',
    icon: SlidersHorizontal,
  },
] as const;

export function AdminSidebar({
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [newApplicationsCount, setNewApplicationsCount] = useState(0);
  const [notificationsUnreadTotal, setNotificationsUnreadTotal] =
    useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeAdminInboxCounts(user.uid, (c) =>
      setNewApplicationsCount(c.newApplications),
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let n = 0;
    let a = 0;
    const emit = () => setNotificationsUnreadTotal(n + a);
    const u1 = subscribeUnreadNotificationCount(user.uid, (c) => {
      n = c;
      emit();
    });
    const u2 = subscribeUnreadAdminEventCount((c) => {
      a = c;
      emit();
    });
    return () => {
      u1();
      u2();
    };
  }, [user]);

  const active = (href: string, end?: boolean) => {
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={[
        'relative flex h-full min-h-0 shrink-0 flex-col overflow-visible border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-60',
      ].join(' ')}
    >
      <div
        className={[
          'relative flex h-[4.5rem] shrink-0 items-center border-b border-zinc-800 px-2 py-3',
          collapsed ? 'justify-center' : 'justify-start gap-2 pr-8',
        ].join(' ')}
      >
        {!collapsed ? (
          <Link
            href="/admin"
            className="flex min-w-0 flex-1 items-center gap-2"
            onClick={onNavigate}
          >
            <MarketingImage
              file="fotomaticLogo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain brightness-0 invert"
            />
            <MarketingImage
              file="fotomatic.jpg"
              alt="Fotomatic"
              width={110}
              height={28}
              className="h-6 w-auto max-w-[100px] object-contain object-left brightness-0 invert"
            />
          </Link>
        ) : (
          <Link
            href="/admin"
            className="flex justify-center"
            onClick={onNavigate}
            title="Admin home"
          >
            <MarketingImage
              file="fotomaticLogo.png"
              alt="Admin"
              width={36}
              height={36}
              className="h-9 w-9 object-contain brightness-0 invert"
            />
          </Link>
        )}
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="absolute right-1 top-1/2 z-10 inline-flex -translate-y-1/2 rounded-md p-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-1/2 z-20 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-600 bg-zinc-900 text-zinc-200 shadow-md hover:border-amber-500/60 hover:bg-zinc-800 hover:text-white lg:inline-flex"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>
      </div>
      {!collapsed ? (
        <p className="px-4 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/90">
          Admin
        </p>
      ) : (
        <div className="h-1" />
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {!collapsed ? (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Main
          </p>
        ) : null}
        <div className="space-y-0.5">
          {mainNav.map((item) => {
            const { href, label, icon: Icon, end } = item;
            const collapsedTitle = label;
            const showAppBadge =
              href === '/admin/inbox' && newApplicationsCount > 0;
            const showNotifBadge =
              href === '/admin/notifications' &&
              notificationsUnreadTotal > 0;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? collapsedTitle : undefined}
                onClick={onNavigate}
                className={[
                  'relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  active(href, end)
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
                {!collapsed ? (
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span>{label}</span>
                    {showAppBadge ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                        {newApplicationsCount > 99
                          ? '99+'
                          : newApplicationsCount}
                      </span>
                    ) : null}
                    {showNotifBadge ? (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {notificationsUnreadTotal > 99
                          ? '99+'
                          : notificationsUnreadTotal}
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {collapsed && showAppBadge ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-zinc-950">
                    {newApplicationsCount > 9 ? '9+' : newApplicationsCount}
                  </span>
                ) : null}
                {collapsed && showNotifBadge ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-900 px-0.5 text-[9px] font-bold text-white">
                    {notificationsUnreadTotal > 9
                      ? '9+'
                      : notificationsUnreadTotal}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {!collapsed ? (
          <p className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Settings
          </p>
        ) : (
          <div className="mt-4 border-t border-zinc-800 pt-4" />
        )}
        <div className="space-y-0.5">
          {settingsNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={onNavigate}
              className={[
                'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                active(href)
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
              {!collapsed ? label : null}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
