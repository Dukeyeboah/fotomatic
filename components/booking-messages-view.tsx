'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { bookingStatusBadge } from '@/lib/booking-status-display';
import {
  markThreadReadByClient,
  sendThreadMessage,
  subscribeMessagesForThread,
  subscribeThreadsForClient,
  type BookingThread,
  type BookingThreadMessage,
} from '@/lib/firebase/booking-threads';
import { BookingPaymentModal } from '@/components/booking-payment-modal';
import { Loader2 } from 'lucide-react';

const PANE_HEIGHT =
  'h-[min(72vh,760px)] max-h-[min(72vh,760px)]';

export function BookingMessagesView({
  ordersLinkHref = '/dashboard/bookings',
  loginRedirectTo = '/dashboard/messages',
}: {
  ordersLinkHref?: string;
  loginRedirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get('thread');

  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BookingThreadMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const selectThread = (id: string | null | undefined) => {
    if (!id) return;
    setActiveThreadId(id);
    router.push(`${pathname}?thread=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (!user) return;
    return subscribeThreadsForClient(user.uid, setThreads);
  }, [user]);

  useEffect(() => {
    if (threadFromUrl) {
      setActiveThreadId(threadFromUrl);
      return;
    }
    setActiveThreadId((cur) => {
      if (cur) return cur;
      return null;
    });
  }, [threadFromUrl]);

  useEffect(() => {
    if (threadFromUrl) return;
    setActiveThreadId((cur) => {
      if (cur) return cur;
      return threads[0]?.id ?? null;
    });
  }, [threads, threadFromUrl]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    return subscribeMessagesForThread(activeThreadId, setMessages);
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId || !user) return;
    void markThreadReadByClient(activeThreadId);
  }, [activeThreadId, user]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-0">
      <div className="sticky top-14 z-20 -mx-4 flex items-end justify-between gap-4 border-b border-zinc-200/70 bg-[#f4f1ec]/95 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-[#f4f1ec]/90 sm:mx-0 sm:rounded-none">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Messages
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Choose a conversation on the left to read and reply.
          </p>
        </div>
        <Link
          href={ordersLinkHref}
          className="shrink-0 text-sm font-semibold text-amber-900 underline"
        >
          View bookings
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
          to view messages.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            <p className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-2.5 pt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Conversations
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-3">
              {threads.length === 0 ? (
                <div className="px-2 py-6 text-sm text-zinc-600">
                  No threads yet. Create one from the directory booking form.
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map((t) => {
                    const b = bookingStatusBadge(t.status);
                    const unread = t.unreadByClientCount ?? 0;
                    const hasUnread = unread > 0 && t.id !== activeThreadId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectThread(t.id)}
                        className={[
                          'w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm transition-colors',
                          t.id === activeThreadId
                            ? 'bg-amber-100 text-zinc-950 shadow-sm ring-2 ring-amber-500/80'
                            : hasUnread
                              ? 'bg-amber-50/80 text-zinc-900 ring-1 ring-amber-200/80 hover:bg-amber-50'
                              : 'text-zinc-800 hover:bg-zinc-100',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={[
                                'truncate',
                                hasUnread ? 'font-bold' : 'font-semibold',
                              ].join(' ')}
                            >
                              {t.photographerName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-600">
                              {t.eventType} · {t.eventDate}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {hasUnread ? (
                              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${b.className}`}
                            >
                              {b.label}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            {!activeThread ? (
              <div className="p-6 text-sm text-zinc-600">
                Select a thread to view messages.
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {activeThread.photographerName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {activeThread.eventType} · {activeThread.eventDate}
                      {activeThread.eventTimeframe
                        ? ` · ${activeThread.eventTimeframe}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeThread.status === 'accepted_pending_payment' ? (
                      <button
                        type="button"
                        className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                        onClick={() => setPayModalOpen(true)}
                      >
                        Confirm & Pay
                      </button>
                    ) : null}
                    {(() => {
                      const b = bookingStatusBadge(activeThread.status);
                      return (
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${b.className}`}
                        >
                          {b.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <p className="py-6 text-sm text-zinc-600">
                      No messages yet.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id ?? `${m.senderUserId}-${m.text}`}
                        className={[
                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                          m.senderRole === 'client'
                            ? 'ml-auto bg-zinc-900 text-white'
                            : m.senderRole === 'photographer'
                              ? 'bg-zinc-100 text-zinc-900'
                              : 'mx-auto bg-amber-50 text-amber-950',
                        ].join(' ')}
                      >
                        {m.text}
                      </div>
                    ))
                  )}
                </div>

                <form
                  className="flex shrink-0 gap-3 border-t border-zinc-200 px-4 py-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!activeThread.id || !user) return;
                    setSending(true);
                    const res = await sendThreadMessage({
                      threadId: activeThread.id,
                      senderUserId: user.uid,
                      senderRole: 'client',
                      text,
                    });
                    setSending(false);
                    if (res.ok) setText('');
                    else alert(res.message);
                  }}
                >
                  <input
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                    placeholder="Write a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {payModalOpen && activeThread && user ? (
        <BookingPaymentModal
          thread={activeThread}
          user={user}
          open={payModalOpen}
          onClose={() => setPayModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
