'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Loader2, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeRecentThreads } from '@/lib/firebase/admin';
import {
  subscribeMessagesForThread,
  type BookingThread,
  type BookingThreadMessage,
} from '@/lib/firebase/booking-threads';
import { bookingStatusBadge } from '@/lib/booking-status-display';
import { clientBookingAvatarUrl } from '@/lib/photographer-booking-dashboard';

const ADMIN_THREAD_LIMIT = 120;

export function AdminBookingsInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');
  const { user, userData, loading: authLoading } = useAuth();

  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BookingThreadMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const setExpanded = useCallback(
    (id: string | null) => {
      setExpandedId(id);
      if (id) {
        router.replace(
          `/admin/bookings?thread=${encodeURIComponent(id)}`,
          { scroll: false },
        );
      } else {
        router.replace('/admin/bookings', { scroll: false });
      }
    },
    [router],
  );

  useEffect(() => {
    if (!user || userData?.role !== 'admin') return;
    setThreadsLoading(true);
    const unsub = subscribeRecentThreads((list) => {
      setThreads(list);
      setThreadsLoading(false);
    }, ADMIN_THREAD_LIMIT);
    return () => unsub();
  }, [user, userData?.role]);

  useEffect(() => {
    if (threadsLoading || threads.length === 0) return;
    if (threadParam && threads.some((t) => t.id === threadParam)) {
      setExpandedId(threadParam);
    }
  }, [threadsLoading, threads, threadParam]);

  useEffect(() => {
    if (!expandedId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    const unsub = subscribeMessagesForThread(expandedId, (m) => {
      setMessages(m);
      setMessagesLoading(false);
    });
    return () => unsub();
  }, [expandedId]);

  if (authLoading || !user || !userData) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (userData.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950">
        This inbox is for admin accounts.
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Booking threads
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Read-only view of client ↔ photographer booking conversations and
        lifecycle. Expand a row to load messages. Support / contact form
        messages are under{' '}
        <Link
          href="/admin/messages"
          className="font-semibold text-amber-900 underline"
        >
          Messages
        </Link>
        .
      </p>

      <div className="mt-8 space-y-3">
        {threadsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : threads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600">
            No booking threads yet.
          </p>
        ) : (
          threads.map((t) => {
            const open = expandedId === t.id;
            const photo = clientBookingAvatarUrl(t);
            const badge = bookingStatusBadge(t.status);
            const total =
              typeof t.acceptedTotalPrice === 'number' && t.acceptedTotalPrice > 0
                ? `$${t.acceptedTotalPrice.toLocaleString()}`
                : null;
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : t.id ?? null)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  {open ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
                  )}
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-900/5">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback instanceof HTMLElement) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={photo ? { display: 'none' } : undefined}
                    >
                      <UserRound
                        className="h-5 w-5 text-zinc-400"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-900">
                      {t.clientName || 'Client'} → {t.photographerName}
                    </p>
                    <p className="truncate text-xs text-zinc-600">
                      {t.eventType} · {t.eventDate}
                      {total ? ` · ${total}` : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </button>

                {open && t.id ? (
                  <div className="space-y-4 border-t border-zinc-100 px-4 pb-6 pt-4">
                    <div className="text-sm text-zinc-700">
                      <p>
                        <span className="font-semibold text-zinc-900">
                          Client:
                        </span>{' '}
                        {t.clientName} ({t.clientEmail})
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold text-zinc-900">
                          When / where:
                        </span>{' '}
                        {t.eventDate}
                        {t.eventTimeframe ? ` · ${t.eventTimeframe}` : ''} ·{' '}
                        {t.duration} · {t.eventLocation}
                      </p>
                      {t.clientMessage ? (
                        <p className="mt-2 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-800">
                          <span className="font-semibold text-zinc-900">
                            Original request:{' '}
                          </span>
                          {t.clientMessage}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Thread messages
                      </p>
                      <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-zinc-50 p-3">
                        {messagesLoading ? (
                          <p className="text-center text-sm text-zinc-500">
                            Loading messages…
                          </p>
                        ) : messages.length === 0 ? (
                          <p className="text-center text-sm text-zinc-500">
                            No messages yet.
                          </p>
                        ) : (
                          messages.map((m) => (
                            <div
                              key={m.id ?? `${m.createdAt}-${m.text}`}
                              className={[
                                'rounded-xl px-3 py-2 text-sm',
                                m.senderRole === 'system'
                                  ? 'bg-amber-50 text-amber-950'
                                  : m.senderRole === 'photographer'
                                    ? 'ml-4 bg-emerald-50 text-emerald-950'
                                    : 'mr-4 bg-white text-zinc-900 ring-1 ring-zinc-200',
                              ].join(' ')}
                            >
                              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                {m.senderRole}
                              </span>
                              {m.text}
                            </div>
                          ))
                        )}
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        Admins cannot post into booking threads from here (client
                        and photographer roles only).
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
