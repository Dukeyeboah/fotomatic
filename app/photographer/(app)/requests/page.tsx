'use client';

import Link from 'next/link';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import {
  clientBookingAvatarUrl,
  formatThreadDateDisplay,
} from '@/lib/photographer-booking-dashboard';
import { PhotographerRequestCard } from '@/components/photographer/photographer-request-card';

export default function PhotographerRequestsPage() {
  const { threads, loading } = usePhotographerBookingThreads();
  const open = threads.filter((t) => t.status === 'requested');

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Requests
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Open requests from clients (live from your booking threads). Respond
            with accept, a suggested time, or decline in your{' '}
            <Link
              href="/photographer/bookings"
              className="font-semibold text-amber-900 underline"
            >
              bookings inbox
            </Link>
            .
          </p>
        </div>
        <Link
          href="/photographer"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : open.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600">
            No open requests right now.
          </p>
        ) : (
          open.map((t) => (
            <PhotographerRequestCard
              key={t.id}
              clientName={t.clientName}
              clientAvatarUrl={clientBookingAvatarUrl(t)}
              shootType={t.eventType}
              location={t.eventLocation}
              date={formatThreadDateDisplay(t.eventDate)}
              duration={t.duration}
              respondHref={`/photographer/bookings?thread=${encodeURIComponent(t.id ?? '')}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
