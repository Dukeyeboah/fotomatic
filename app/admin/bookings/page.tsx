'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { subscribeRecentThreads } from '@/lib/firebase/admin';
import type { BookingThread } from '@/lib/firebase/booking-threads';

function statusLabel(s: BookingThread['status']): string {
  switch (s) {
    case 'requested':
      return 'Requested';
    case 'accepted_pending_payment':
      return 'Pending payment';
    case 'confirmed':
      return 'Confirmed';
    case 'pending_client_response':
      return 'Pending client';
    case 'declined':
      return 'Declined';
    case 'expired':
      return 'Expired';
    default:
      return s;
  }
}

export default function AdminBookingsPage() {
  const [threads, setThreads] = useState<BookingThread[]>([]);

  useEffect(() => {
    return subscribeRecentThreads(setThreads);
  }, []);

  const sorted = useMemo(
    () =>
      [...threads].sort((a, b) => {
        const ma =
          a.updatedAt && typeof a.updatedAt === 'object' && 'toMillis' in a.updatedAt
            ? (a.updatedAt as { toMillis: () => number }).toMillis()
            : 0;
        const mb =
          b.updatedAt && typeof b.updatedAt === 'object' && 'toMillis' in b.updatedAt
            ? (b.updatedAt as { toMillis: () => number }).toMillis()
            : 0;
        return mb - ma;
      }),
    [threads],
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            All booking threads (read across roles).
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {sorted.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">
                  {t.clientName} → {t.photographerName}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {t.eventType} · {t.eventDate} · {t.duration}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{t.eventLocation}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {statusLabel(t.status)}
                </span>
                {t.id ? (
                  <Link
                    href={`/messages?thread=${encodeURIComponent(t.id)}`}
                    className="text-xs font-semibold text-amber-900 underline"
                  >
                    View thread
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
