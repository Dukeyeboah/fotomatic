'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  subscribeThreadsForClient,
  type BookingThread,
} from '@/lib/firebase/booking-threads';
import { Loader2 } from 'lucide-react';

function formatPaidAmount(t: BookingThread): string {
  if (typeof t.paidAmountCents === 'number' && t.paidAmountCents > 0) {
    return `$${(t.paidAmountCents / 100).toFixed(2)}`;
  }
  if (typeof t.acceptedTotalPrice === 'number') {
    return `$${t.acceptedTotalPrice.toFixed(2)}`;
  }
  return '—';
}

export default function DashboardPaymentsPage() {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [threads, setThreads] = useState<BookingThread[]>([]);

  useEffect(() => {
    if (!user) return;
    return subscribeThreadsForClient(user.uid, setThreads);
  }, [user]);

  const paid = useMemo(
    () => threads.filter((t) => t.status === 'confirmed'),
    [threads],
  );
  const awaiting = useMemo(
    () => threads.filter((t) => t.status === 'accepted_pending_payment'),
    [threads],
  );

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Payments
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Pay accepted bookings through Stripe. All payments are processed to
        Fotomatic&apos;s Stripe account.
      </p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      ) : !user ? (
        <p className="mt-8 text-sm text-zinc-600">
          <button
            type="button"
            onClick={() => openLoginModal({ redirectTo: '/dashboard/payments' })}
            className="font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to view payments.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {awaiting.length > 0 ? (
            <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-amber-950">
                Awaiting payment
              </h2>
              <ul className="mt-4 space-y-3">
                {awaiting.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-amber-900/10"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {t.photographerName}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {t.eventType} · {formatPaidAmount(t)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/messages?thread=${encodeURIComponent(t.id ?? '')}`}
                      className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                    >
                      Pay now
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">
              Payment history
            </h2>
            {paid.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-600">
                No completed payments yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100">
                {paid.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {t.photographerName}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {t.eventType} · {t.eventDate}
                        {t.discountCodeApplied
                          ? ` · Code: ${t.discountCodeApplied}`
                          : ''}
                      </p>
                    </div>
                    <p className="font-semibold text-zinc-900">
                      {formatPaidAmount(t)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
