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
import { BookingPaymentModal } from '@/components/booking-payment-modal';
import { Loader2 } from 'lucide-react';

const PANE_HEIGHT =
  'h-[min(72vh,760px)] max-h-[min(72vh,760px)]';

function formatPaidAmount(t: BookingThread): string {
  if (typeof t.paidAmountCents === 'number' && t.paidAmountCents > 0) {
    return `$${(t.paidAmountCents / 100).toFixed(2)}`;
  }
  if (typeof t.acceptedTotalPrice === 'number') {
    return `$${t.acceptedTotalPrice.toFixed(2)}`;
  }
  return '—';
}

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

type PaymentRow = BookingThread & { paymentKind: 'awaiting' | 'paid' };

export function DashboardPaymentsView() {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paymentFromUrl = searchParams.get('payment');

  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeThreadsForClient(user.uid, setThreads);
  }, [user]);

  const rows = useMemo(() => {
    const list: PaymentRow[] = [];
    for (const t of threads) {
      if (t.status === 'accepted_pending_payment') {
        list.push({ ...t, paymentKind: 'awaiting' });
      } else if (t.status === 'confirmed') {
        list.push({ ...t, paymentKind: 'paid' });
      }
    }
    return list.sort(
      (a, b) => firestoreMs(b.updatedAt) - firestoreMs(a.updatedAt),
    );
  }, [threads]);

  const active = useMemo(
    () => rows.find((t) => t.id === activeId) ?? null,
    [rows, activeId],
  );

  const selectPayment = (id: string | null | undefined) => {
    if (!id) return;
    setActiveId(id);
    router.push(`${pathname}?payment=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  useEffect(() => {
    if (paymentFromUrl) {
      setActiveId(paymentFromUrl);
      return;
    }
    setActiveId((cur) => cur ?? rows[0]?.id ?? null);
  }, [paymentFromUrl, rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-0 sm:px-6">
      <div className="sticky top-14 z-20 -mx-4 flex items-end justify-between gap-4 border-b border-zinc-200/70 bg-[#f4f1ec]/95 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-[#f4f1ec]/90 sm:-mx-6 sm:px-6">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Payments
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Review amounts due and your payment history.
          </p>
        </div>
        <Link
          href="/dashboard/bookings"
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
              openLoginModal({ redirectTo: '/dashboard/payments' })
            }
            className="font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to view payments.
        </p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          No payments yet. When a photographer accepts a booking, it will show
          up here.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            <p className="shrink-0 border-b border-zinc-100 bg-white px-4 pb-2.5 pt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Transactions
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-3">
              <div className="space-y-1">
                {rows.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectPayment(t.id)}
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
                          {t.eventType} · {formatPaidAmount(t)}
                        </p>
                      </div>
                      <span
                        className={[
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                          t.paymentKind === 'awaiting'
                            ? 'bg-amber-50 text-amber-950 ring-amber-200'
                            : 'bg-emerald-50 text-emerald-900 ring-emerald-200',
                        ].join(' ')}
                      >
                        {t.paymentKind === 'awaiting' ? 'Due' : 'Paid'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section
            className={`flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${PANE_HEIGHT}`}
          >
            {!active ? (
              <div className="p-6 text-sm text-zinc-600">
                Select a transaction to view details.
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-zinc-900">
                      {active.photographerName}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {active.eventType} · {active.eventDate}
                    </p>
                  </div>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold ring-1',
                      active.paymentKind === 'awaiting'
                        ? 'bg-amber-50 text-amber-950 ring-amber-200'
                        : 'bg-emerald-50 text-emerald-900 ring-emerald-200',
                    ].join(' ')}
                  >
                    {active.paymentKind === 'awaiting'
                      ? 'Awaiting payment'
                      : 'Paid'}
                  </span>
                </div>

                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Amount
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-zinc-900">
                      {formatPaidAmount(active)}
                    </dd>
                  </div>
                  {active.discountCodeApplied ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Discount code
                      </dt>
                      <dd className="mt-1 text-zinc-900">
                        {active.discountCodeApplied}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Location
                    </dt>
                    <dd className="mt-1 text-zinc-900">
                      {active.eventLocation || '—'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                  {active.paymentKind === 'awaiting' ? (
                    <button
                      type="button"
                      onClick={() => setPayOpen(true)}
                      className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
                    >
                      Pay now
                    </button>
                  ) : null}
                  <Link
                    href={`/dashboard/messages?thread=${encodeURIComponent(active.id ?? '')}`}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Open messages
                  </Link>
                  <Link
                    href={`/dashboard/bookings?booking=${encodeURIComponent(active.id ?? '')}`}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                  >
                    Booking details
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {payOpen && active && user ? (
        <BookingPaymentModal
          thread={active}
          user={user}
          open={payOpen}
          onClose={() => setPayOpen(false)}
        />
      ) : null}
    </div>
  );
}
