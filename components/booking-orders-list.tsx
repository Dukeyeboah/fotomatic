'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  subscribeThreadsForClient,
  type BookingThread,
} from '@/lib/firebase/booking-threads';
import { bookingStatusBadge } from '@/lib/booking-status-display';
import { Loader2 } from 'lucide-react';

export function BookingOrdersList({
  title = 'Orders',
  subtitle = 'Your booking history and current status.',
  messagesLinkHref = '/dashboard/messages',
  threadLinkBase = '/dashboard/messages',
  loginRedirectTo = '/dashboard/bookings',
}: {
  title?: string;
  subtitle?: string;
  messagesLinkHref?: string;
  /** Prefix for thread deep link, e.g. `/dashboard/messages?thread=` */
  threadLinkBase?: string;
  loginRedirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [threads, setThreads] = useState<BookingThread[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeThreadsForClient(user.uid, setThreads);
  }, [user]);

  const sorted = useMemo(() => {
    return [...threads].sort((a, b) => {
      const ta =
        a.updatedAt &&
        typeof a.updatedAt === 'object' &&
        'toMillis' in a.updatedAt &&
        typeof (a.updatedAt as { toMillis: () => number }).toMillis ===
          'function'
          ? (a.updatedAt as { toMillis: () => number }).toMillis()
          : 0;
      const tb =
        b.updatedAt &&
        typeof b.updatedAt === 'object' &&
        'toMillis' in b.updatedAt &&
        typeof (b.updatedAt as { toMillis: () => number }).toMillis ===
          'function'
          ? (b.updatedAt as { toMillis: () => number }).toMillis()
          : 0;
      return tb - ta;
    });
  }, [threads]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
        </div>
        <Link
          href={messagesLinkHref}
          className="text-sm font-semibold text-amber-900 underline"
        >
          View messages
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      ) : !user ? (
        <p className="mt-8 text-sm text-zinc-600">
          <button
            type="button"
            onClick={() => openLoginModal({ redirectTo: loginRedirectTo })}
            className="cursor-pointer font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to view bookings.
        </p>
      ) : sorted.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          No bookings yet.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {sorted.map((t) => {
            const badge = bookingStatusBadge(t.status);
            return (
            <div
              key={t.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {t.photographerName}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {t.eventType} · {t.eventDate}
                    {t.eventTimeframe ? ` · ${t.eventTimeframe}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {t.duration} · {t.eventLocation}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  href={`${threadLinkBase}?thread=${encodeURIComponent(t.id ?? '')}`}
                >
                  Open thread
                </Link>
                {t.status === 'accepted_pending_payment' ? (
                  <button
                    type="button"
                    className="rounded-full border border-amber-200/80 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                    onClick={() => {
                      alert(
                        'Confirm & Pay is coming next (Stripe). Your booking is accepted and awaiting payment.',
                      );
                    }}
                  >
                    Confirm & Pay
                  </button>
                ) : null}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
