'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import {
  CircleUserRound,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  HelpCircle,
  CalendarCheck,
  Inbox,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

function displayFirstName(
  userData: ReturnType<typeof useAuth>['userData'],
  email: string | null,
): string {
  const name =
    userData?.displayName?.trim() ||
    (email?.split('@')[0] ?? 'there');
  const first = name.split(/\s+/)[0];
  return first || 'there';
}

function MenuRow({
  href,
  icon: Icon,
  children,
  onNavigate,
  className = '',
}: {
  href: string;
  icon: typeof CalendarCheck;
  children: ReactNode;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
      {children}
    </Link>
  );
}

export function DashboardAccountMenu() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (loading || !user) return null;

  const label =
    userData?.username?.trim() ||
    displayFirstName(userData, user.email ?? null);
  const firstName = displayFirstName(userData, user.email ?? null);
  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-[220px] cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:pr-3"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <CircleUserRound className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
        <span className="hidden min-w-0 truncate sm:inline">{label}</span>
        <ChevronDown className="hidden h-4 w-4 shrink-0 text-zinc-500 sm:block" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-900/5">
          <p className="border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500">
            Signed in as{' '}
            <span className="font-medium text-zinc-800">{firstName}</span>
          </p>
          {userData?.role === 'admin' ? (
            <MenuRow
              href="/admin"
              icon={LayoutDashboard}
              onNavigate={close}
              className="font-semibold text-amber-900"
            >
              Admin dashboard
            </MenuRow>
          ) : null}
          {userData?.role === 'admin' ? (
            <MenuRow href="/admin/inbox" icon={Inbox} onNavigate={close}>
              Inbox
            </MenuRow>
          ) : null}
          <MenuRow
            href="/dashboard/bookings"
            icon={CalendarCheck}
            onNavigate={close}
          >
            My bookings
          </MenuRow>
          <MenuRow
            href="/dashboard/messages"
            icon={MessageCircle}
            onNavigate={close}
          >
            Messages
          </MenuRow>
          <MenuRow
            href="/dashboard/settings"
            icon={Settings}
            onNavigate={close}
          >
            Account settings
          </MenuRow>
          <MenuRow href="/contact" icon={HelpCircle} onNavigate={close}>
            Help / Support
          </MenuRow>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={async () => {
              close();
              await signOutUser();
              router.push('/');
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
