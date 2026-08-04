'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import {
  CalendarCheck,
  CircleUserRound,
  CreditCard,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { subscribeThreadsForClient } from '@/lib/firebase/booking-threads';

function displayFirstName(
  userData: ReturnType<typeof useAuth>['userData'],
  email: string | null,
): string {
  const name =
    userData?.displayName?.trim() || (email?.split('@')[0] ?? 'there');
  const first = name.split(/\s+/)[0];
  return first || 'there';
}

function MenuRow({
  href,
  icon: Icon,
  children,
  onNavigate,
  className = '',
  suffix,
}: {
  href: string;
  icon: typeof CalendarCheck;
  children: ReactNode;
  onNavigate: () => void;
  className?: string;
  suffix?: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">{children}</span>
      {suffix ?? null}
    </Link>
  );
}

export function DashboardAccountMenu() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setMessagesUnread(0);
      return;
    }
    return subscribeThreadsForClient(user.uid, (threads) => {
      const n = threads.reduce(
        (acc, t) => acc + (t.unreadByClientCount ?? 0),
        0,
      );
      setMessagesUnread(n);
    });
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (loading || !user) return null;

  const firstName = displayFirstName(userData, user.email ?? null);
  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center rounded-full border border-zinc-200 bg-white p-0.5 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <CircleUserRound className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-900/5">
          <p className="border-b border-zinc-100 px-4 py-2 text-xs text-zinc-500">
            Signed in as{' '}
            <span className="font-medium text-zinc-800">{firstName}</span>
          </p>
          <MenuRow href="/home" icon={Home} onNavigate={close}>
            Home
          </MenuRow>
          <MenuRow
            href="/photographers"
            icon={Search}
            onNavigate={close}
          >
            Photographers
          </MenuRow>
          <MenuRow
            href="/messages"
            icon={MessageCircle}
            onNavigate={close}
            suffix={
              messagesUnread > 0 ? (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {messagesUnread > 99 ? '99+' : messagesUnread}
                </span>
              ) : null
            }
          >
            Messages
          </MenuRow>
          <MenuRow
            href="/bookings"
            icon={CalendarCheck}
            onNavigate={close}
          >
            My bookings
          </MenuRow>
          <MenuRow href="/saved" icon={Heart} onNavigate={close}>
            Saved
          </MenuRow>
          <MenuRow
            href="/payments"
            icon={CreditCard}
            onNavigate={close}
          >
            Payments
          </MenuRow>
          <MenuRow
            href="/settings"
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
            <LogOut
              className="h-4 w-4 shrink-0 text-zinc-500"
              strokeWidth={1.75}
            />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
