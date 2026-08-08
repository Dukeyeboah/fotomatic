'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import { subscribeThreadsForPhotographer } from '@/lib/firebase/booking-threads';
import { effectivePhotographerDirectoryId } from '@/lib/photographer-booking-dashboard';
import {
  Calendar,
  CalendarCheck,
  CircleDollarSign,
  CircleUserRound,
  HelpCircle,
  Home,
  LogOut,
  Bell,
  Heart,
  MessageCircle,
  Search,
  Settings,
  Star,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePhotographerBookingThreadsOptional } from '@/contexts/PhotographerBookingThreadsContext';

function firstName(
  userData: ReturnType<typeof useAuth>['userData'],
  email: string | null,
): string {
  const raw =
    userData?.displayName?.trim() || email?.split('@')[0] || 'there';
  return raw.split(/\s+/)[0] || 'there';
}

function MenuRow({
  href,
  icon: Icon,
  children,
  onNavigate,
  suffix,
}: {
  href: string;
  icon: typeof UserRound;
  children: ReactNode;
  onNavigate: () => void;
  suffix?: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">{children}</span>
      {suffix ?? null}
    </Link>
  );
}

export function PhotographerAccountMenu() {
  const { user, userData, loading } = useAuth();
  const threadsCtx = usePhotographerBookingThreadsOptional();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [standaloneRequestCount, setStandaloneRequestCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const directoryId = useMemo(() => {
    if (!user || userData?.role !== 'photographer') return null;
    return effectivePhotographerDirectoryId(
      user.uid,
      userData.photographer?.directoryId,
    );
  }, [user, userData?.role, userData?.photographer?.directoryId]);

  useEffect(() => {
    if (threadsCtx || !user || !directoryId) {
      setStandaloneRequestCount(0);
      return;
    }
    return subscribeThreadsForPhotographer({
      photographerUserId: user.uid,
      directoryId,
      cb: (threads) => {
        setStandaloneRequestCount(
          threads.filter((t) => t.status === 'requested').length,
        );
      },
    });
  }, [threadsCtx, user, directoryId]);

  const openRequests = threadsCtx
    ? threadsCtx.threads.filter((t) => t.status === 'requested').length
    : standaloneRequestCount;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (loading || !user) return null;

  const greet = firstName(userData, user.email ?? null);
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
            <span className="font-medium text-zinc-800">{greet}</span>
          </p>
          <MenuRow href="/photographer" icon={Home} onNavigate={close}>
            Home
          </MenuRow>
          <MenuRow
            href="/photographer/directory"
            icon={Search}
            onNavigate={close}
          >
            Photographers
          </MenuRow>
          <MenuRow
            href="/photographer/messages"
            icon={MessageCircle}
            onNavigate={close}
          >
            Messages
          </MenuRow>
          <MenuRow
            href="/photographer/notifications"
            icon={Bell}
            onNavigate={close}
          >
            Notifications
          </MenuRow>
          <MenuRow
            href="/photographer/favorites"
            icon={Heart}
            onNavigate={close}
          >
            Favorites
          </MenuRow>
          <MenuRow
            href="/photographer/bookings"
            icon={CalendarCheck}
            onNavigate={close}
            suffix={
              openRequests > 0 ? (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                  {openRequests > 99 ? '99+' : openRequests}
                </span>
              ) : null
            }
          >
            Bookings
          </MenuRow>
          <MenuRow
            href="/photographer/calendar"
            icon={Calendar}
            onNavigate={close}
          >
            Calendar
          </MenuRow>
          <MenuRow
            href="/photographer/earnings"
            icon={CircleDollarSign}
            onNavigate={close}
          >
            Earnings
          </MenuRow>
          <MenuRow href="/photographer/reviews" icon={Star} onNavigate={close}>
            Reviews
          </MenuRow>
          <MenuRow
            href="/photographer/profile"
            icon={UserRound}
            onNavigate={close}
          >
            Profile
          </MenuRow>
          <MenuRow
            href="/photographer/settings"
            icon={Settings}
            onNavigate={close}
          >
            Account settings
          </MenuRow>
          <MenuRow
            href="/photographer/contact"
            icon={HelpCircle}
            onNavigate={close}
          >
            Help / Support
          </MenuRow>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
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
