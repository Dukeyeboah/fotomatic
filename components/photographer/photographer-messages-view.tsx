'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { bookingStatusBadge } from '@/lib/booking-status-display';
import {
  sendThreadMessage,
  subscribeMessagesForThread,
  type BookingThreadMessage,
} from '@/lib/firebase/booking-threads';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

const PANE_HEIGHT =
  'h-[min(72vh,760px)] max-h-[min(72vh,760px)]';

export function PhotographerMessagesView() {
  const { user, loading: authLoading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { threads, loading: threadsLoading } = usePhotographerBookingThreads();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get('thread');

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BookingThreadMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const chatOpen = Boolean(activeThreadId);

  const selectThread = (id: string | null | undefined) => {
    if (!id) return;
    setActiveThreadId(id);
    router.push(`${pathname}?thread=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  const backToThreads = () => {
    setActiveThreadId(null);
    router.push(pathname, { scroll: false });
  };

  useEffect(() => {
    setActiveThreadId(threadFromUrl);
  }, [threadFromUrl]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    return subscribeMessagesForThread(activeThreadId, setMessages);
  }, [activeThreadId]);

  const loading = authLoading || threadsLoading;

  return (
    <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Messages
        </h1>
        <Link
          href="/photographer/bookings"
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
            onClick={() =>
              openLoginModal({ redirectTo: '/photographer/messages' })
            }
            className="cursor-pointer font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to view messages.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={[
              'flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm',
              PANE_HEIGHT,
              chatOpen ? 'hidden lg:flex' : 'flex',
            ].join(' ')}
          >
            <p className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-2.5 pt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Conversations
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-3">
              {threads.length === 0 ? (
                <div className="px-2 py-6 text-sm text-zinc-600">
                  No conversations yet. New booking requests will appear here.
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map((t) => {
                    const b = bookingStatusBadge(t.status);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectThread(t.id)}
                        className={[
                          'w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm transition-colors',
                          t.id === activeThreadId
                            ? 'bg-amber-100 text-zinc-950 shadow-sm ring-2 ring-amber-500/80'
                            : 'text-zinc-800 hover:bg-zinc-100',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">
                              {t.clientName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-600">
                              {t.eventType} · {t.eventDate}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${b.className}`}
                          >
                            {b.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section
            className={[
              'flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm',
              PANE_HEIGHT,
              chatOpen ? 'flex' : 'hidden lg:flex',
            ].join(' ')}
          >
            {!activeThread ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-600">
                Select a conversation to view messages.
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-start gap-2 border-b border-zinc-200 px-3 py-3 sm:px-4">
                  <button
                    type="button"
                    onClick={backToThreads}
                    aria-label="Back to conversations"
                    className="mt-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {activeThread.clientName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {activeThread.eventType} · {activeThread.eventDate}
                      {activeThread.eventTimeframe
                        ? ` · ${activeThread.eventTimeframe}`
                        : ''}
                      {activeThread.eventLocation
                        ? ` · ${activeThread.eventLocation}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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
                    <Link
                      href={`/photographer/bookings?thread=${encodeURIComponent(activeThread.id ?? '')}`}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Open booking
                    </Link>
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-4">
                  {messages.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-600">
                      No messages yet.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id ?? `${m.senderUserId}-${m.text}`}
                        className={[
                          'max-w-[80%] rounded-[1.15rem] px-3.5 py-2 text-sm leading-relaxed',
                          m.senderRole === 'photographer'
                            ? 'ml-auto rounded-br-md bg-zinc-900 text-white'
                            : m.senderRole === 'client'
                              ? 'mr-auto rounded-bl-md bg-zinc-100 text-zinc-900'
                              : 'mx-auto bg-amber-50 text-amber-950',
                        ].join(' ')}
                      >
                        {m.text}
                      </div>
                    ))
                  )}
                </div>

                <form
                  className="flex shrink-0 gap-2 border-t border-zinc-200 px-3 py-3 sm:gap-3 sm:px-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!activeThread.id || !user) return;
                    setSending(true);
                    const res = await sendThreadMessage({
                      threadId: activeThread.id,
                      senderUserId: user.uid,
                      senderRole: 'photographer',
                      text,
                    });
                    setSending(false);
                    if (res.ok) setText('');
                    else alert(res.message);
                  }}
                >
                  <input
                    className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                    placeholder="Message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
