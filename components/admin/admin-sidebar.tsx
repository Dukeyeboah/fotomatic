'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Camera,
  CalendarCheck,
  MessageSquare,
  Tags,
  MapPin,
  CircleDollarSign,
  SlidersHorizontal,
  Inbox,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

const mainNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/admin/users', label: 'Users', icon: Users, end: false },
  { href: '/admin/photographers', label: 'Photographers', icon: Camera, end: false },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare, end: false },
  { href: '/admin/inbox', label: 'Applications', icon: Inbox, end: false },
] as const;

const settingsNav = [
  { href: '/admin/settings/categories', label: 'Categories', icon: Tags },
  { href: '/admin/settings/locations', label: 'Locations', icon: MapPin },
  {
    href: '/admin/settings/pricing-fees',
    label: 'Pricing & Fees',
    icon: CircleDollarSign,
  },
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

  const active = (href: string, end?: boolean) => {
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={[
        'flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-60',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-[4.5rem] shrink-0 items-center border-b border-zinc-800 px-2 py-3',
          collapsed ? 'relative justify-center' : 'justify-between gap-2',
        ].join(' ')}
      >
        {!collapsed ? (
          <Link
            href="/admin"
            className="flex min-w-0 flex-1 items-center gap-2"
            onClick={onNavigate}
          >
            <Image
              src="/fotomaticImages/fotomaticLogo.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain brightness-0 invert"
            />
            <Image
              src="/fotomaticImages/fotomatic.jpg"
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
            <Image
              src="/fotomaticImages/fotomaticLogo.png"
              alt="Admin"
              width={36}
              height={36}
              className="h-9 w-9 object-contain brightness-0 invert"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={[
            'hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:inline-flex',
            collapsed ? 'absolute right-1 top-1/2 -translate-y-1/2' : '',
          ].join(' ')}
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
        <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500/90">
          Admin
        </p>
      ) : (
        <div className="h-1" />
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {!collapsed ? (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Main
          </p>
        ) : null}
        <div className="space-y-0.5">
          {mainNav.map(({ href, label, icon: Icon, end }) => (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={onNavigate}
              className={[
                'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                active(href, end)
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} />
              {!collapsed ? label : null}
            </Link>
          ))}
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
