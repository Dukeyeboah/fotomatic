'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  subscribeSupportInboxForAdmin,
  markSupportInboxRead,
  type SupportInboxMessage,
} from '@/lib/firebase/support-inbox';
import { formatRelativeFromFirestore } from '@/lib/format-relative-time';
import { Loader2 } from 'lucide-react';

const PANE_HEIGHT = 'h-[min(72vh,760px)] max-h-[min(72vh,760px)]';

function firestoreMs(v: unknown): number {
  if (
    v &&
    typeof v === 'object' &&
    'toMillis' in v &&
    typeof (v as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function AdminSupportInboxInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const threadFromUrl = searchParams.get('thread');

  const [items, setItems] = useState<SupportInboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSupportInboxForAdmin((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }, []);

  const selectThread = (id: string | null | undefined) => {
    if (!id) return;
    setActiveId(id);
    router.push(`${pathname}?thread=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (threadFromUrl) {
      setActiveId(threadFromUrl);
      return;
    }
    setActiveId((cur) => cur ?? null);
  }, [threadFromUrl]);

  useEffect(() => {
    if (threadFromUrl) return;
    setActiveId((cur) => cur ?? items[0]?.id ?? null);
  }, [items, threadFromUrl]);

  const active = useMemo(
    () => items.find((m) => m.id === activeId) ?? null,
    [items, activeId],
  );

  useEffect(() => {
    if (!active?.id || active.readByAdmin) return;
    void markSupportInboxRead(active.id);
  }, [active?.id, active?.readByAdmin]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Messages
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Support and contact enquiries. Booking conversations are on the
            Bookings page.
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="shrink-0 text-sm font-semibold text-amber-900 underline"
        >
          Booking threads
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      ) : (
        <div className="mt-6 grid min-h-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            <p className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-2.5 pt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Conversations
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-3">
              {items.length === 0 ? (
                <div className="px-2 py-6 text-sm text-zinc-600">
                  No support messages yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((m) => {
                    const hasUnread = !m.readByAdmin && m.id !== activeId;
                    const roleLabel =
                      m.senderRole === 'photographer'
                        ? 'Photographer'
                        : 'Client';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectThread(m.id)}
                        className={[
                          'w-full cursor-pointer rounded-xl px-3 py-3 text-left text-sm transition-colors',
                          m.id === activeId
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
                              {m.senderName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-600">
                              {m.subject?.trim() || roleLabel}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {hasUnread ? (
                              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[11px] font-bold text-white">
                                1
                              </span>
                            ) : null}
                            <span className="text-[11px] text-zinc-500">
                              {formatRelativeFromFirestore(m.createdAt)}
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
            className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            {!active ? (
              <div className="p-6 text-sm text-zinc-600">
                Select a conversation to read the message.
              </div>
            ) : (
              <>
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {active.senderName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {active.senderRole === 'photographer'
                        ? 'Photographer'
                        : 'Client'}
                      {active.senderEmail ? ` · ${active.senderEmail}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {formatRelativeFromFirestore(active.createdAt)}
                    {firestoreMs(active.createdAt) > 0
                      ? ` · ${new Date(firestoreMs(active.createdAt)).toLocaleString()}`
                      : ''}
                  </span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="space-y-3">
                    {active.subject ? (
                      <p className="text-sm font-semibold text-zinc-900">
                        {active.subject}
                      </p>
                    ) : null}
                    <div className="max-w-[95%] break-words rounded-2xl bg-zinc-100 px-4 py-3 text-sm whitespace-pre-wrap text-zinc-900">
                      {active.message}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function AdminSupportInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <AdminSupportInboxInner />
    </Suspense>
  );
}
