'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeNotifications } from '@/lib/firebase/booking-threads';

export function DashboardMessagesNavLink({ href }: { href: string }) {
  const { user, loading } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    return subscribeNotifications(user.uid, (items) => {
      setUnread(
        items.filter((i) => !i.read && i.type === 'new_message').length,
      );
    });
  }, [user]);

  if (loading || !user) return null;

  return (
    <Link
      href={href}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
      aria-label="Messages"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
      {unread > 0 ? (
        <span
          className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold text-white"
          aria-label={`${unread} unread messages`}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </Link>
  );
}
