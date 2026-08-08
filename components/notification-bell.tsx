'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  markAllUnreadNotificationsRead,
  subscribeUnreadNotificationCount,
} from '@/lib/firebase/booking-threads';
import { subscribeUnreadAdminEventCount } from '@/lib/firebase/admin';

function notificationsHrefForRole(role: string | undefined): string {
  if (role === 'photographer') return '/photographer/notifications';
  if (role === 'admin') return '/admin/notifications';
  return '/notifications';
}

export function NotificationBell() {
  const { user, userData, loading } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    if (userData?.role === 'admin') {
      let n = 0;
      let a = 0;
      const emit = () => setUnread(n + a);
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
    }
    return subscribeUnreadNotificationCount(user.uid, setUnread);
  }, [user, userData?.role]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (loading || !user) return null;

  const href = notificationsHrefForRole(userData?.role);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[11px] font-semibold text-white"
            aria-label={`${unread} unread notifications`}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
        >
          <Link
            href={href}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            <List className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
            View all
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={marking || unread === 0}
            onClick={async () => {
              if (!user || unread === 0) return;
              setMarking(true);
              await markAllUnreadNotificationsRead(user.uid);
              setMarking(false);
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CheckCheck className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
            {marking ? 'Marking…' : 'Mark all as read'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
