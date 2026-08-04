'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  subscribeThreadsForClient,
  type BookingThread,
} from '@/lib/firebase/booking-threads';
import { bookingStatusBadge } from '@/lib/booking-status-display';
import { BookingPaymentModal } from '@/components/booking-payment-modal';
import { Loader2, MapPin, MessageCircle } from 'lucide-react';

const PANE_HEIGHT =
  'h-[min(72vh,760px)] max-h-[min(72vh,760px)]';

function firestoreMs(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function BookingOrdersList({
  title = 'Orders',
  subtitle = 'Your booking history and current status.',
  messagesLinkHref = '/messages',
  threadLinkBase = '/messages',
  loginRedirectTo = '/bookings',
}: {
  title?: string;
  subtitle?: string;
  messagesLinkHref?: string;
  /** Prefix for thread deep link, e.g. `/messages` */
  threadLinkBase?: string;
  loginRedirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bookingFromUrl = searchParams.get('booking');

  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [payThread, setPayThread] = useState<BookingThread | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeThreadsForClient(user.uid, setThreads);
  }, [user]);

  const sorted = useMemo(() => {
    return [...threads].sort(
      (a, b) => firestoreMs(b.updatedAt) - firestoreMs(a.updatedAt),
    );
  }, [threads]);

  const active = useMemo(
    () => sorted.find((t) => t.id === activeId) ?? null,
    [sorted, activeId],
  );

  const selectBooking = (id: string | null | undefined) => {
    if (!id) return;
    setActiveId(id);
    router.push(`${pathname}?booking=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (bookingFromUrl) {
      setActiveId(bookingFromUrl);
      return;
    }
    setActiveId((cur) => cur ?? sorted[0]?.id ?? null);
  }, [bookingFromUrl, sorted]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">{subtitle}</p>
        </div>
        <Link
          href={messagesLinkHref}
          className="shrink-0 text-sm font-semibold text-amber-900 underline"
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
          No bookings yet.{' '}
          <Link
            href="/photographers"
            className="font-medium text-amber-900 underline"
          >
            Find a photographer
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            <p className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-2.5 pt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Photographers
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-3">
              <div className="space-y-1">
                {sorted.map((t) => {
                  const badge = bookingStatusBadge(t.status);
                  const unread = t.unreadByClientCount ?? 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectBooking(t.id)}
                      className={[
                        'w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm transition-colors',
                        t.id === activeId
                          ? 'bg-amber-100 text-zinc-950 shadow-sm ring-2 ring-amber-500/80'
                          : 'text-zinc-800 hover:bg-zinc-100',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {t.photographerName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-600">
                            {t.eventType} · {t.eventDate}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {unread > 0 ? (
                            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          ) : null}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            {!active ? (
              <div className="p-6 text-sm text-zinc-600">
                Select a booking to view details.
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                {(() => {
                  const badge = bookingStatusBadge(active.status);
                  const messagesHref = `${threadLinkBase}?thread=${encodeURIComponent(active.id ?? '')}`;
                  return (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
                        <div>
                          <h2 className="font-serif text-xl font-medium text-zinc-900">
                            {active.photographerName}
                          </h2>
                          <p className="mt-1 text-sm text-zinc-600">
                            {active.eventType}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <dl className="mt-5 space-y-4 text-sm">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Date &amp; time
                          </dt>
                          <dd className="mt-1 text-zinc-900">
                            {active.eventDate}
                            {active.eventTimeframe
                              ? ` · ${active.eventTimeframe}`
                              : ''}
                            {active.duration ? ` · ${active.duration}` : ''}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Location
                          </dt>
                          <dd className="mt-1 flex items-start gap-1.5 text-zinc-900">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            {active.eventLocation || '—'}
                          </dd>
                        </div>
                        {typeof active.acceptedTotalPrice === 'number' ? (
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Quoted total
                            </dt>
                            <dd className="mt-1 font-semibold text-zinc-900">
                              ${active.acceptedTotalPrice.toFixed(2)}
                            </dd>
                          </div>
                        ) : null}
                        {active.clientMessage?.trim() ? (
                          <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              Your request notes
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap text-zinc-700">
                              {active.clientMessage}
                            </dd>
                          </div>
                        ) : null}
                      </dl>

                      <div className="mt-8 flex flex-wrap gap-3">
                        {active.status === 'accepted_pending_payment' ? (
                          <button
                            type="button"
                            onClick={() => setPayThread(active)}
                            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                          >
                            Complete payment
                          </button>
                        ) : null}
                        <Link
                          href={messagesHref}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                        >
                          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                          Open messages
                        </Link>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </section>
        </div>
      )}

      {payThread && user ? (
        <BookingPaymentModal
          thread={payThread}
          user={user}
          open={Boolean(payThread)}
          onClose={() => setPayThread(null)}
        />
      ) : null}
    </div>
  );
}
