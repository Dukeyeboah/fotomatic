'use client';

import Link from 'next/link';
import { MOCK_UPCOMING_BOOKINGS } from '@/lib/photographer-dashboard-mock';
import { PhotographerBookingRow } from '@/components/photographer/photographer-booking-row';

export default function PhotographerBookingsPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Bookings
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sample schedule — replace with live calendar data.
          </p>
        </div>
        <Link
          href="/photographer"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-8 rounded-2xl border border-zinc-200/90 bg-white px-4 shadow-sm">
        {MOCK_UPCOMING_BOOKINGS.map((b) => (
          <PhotographerBookingRow
            key={b.id}
            clientName={b.clientName}
            shootType={b.shootType}
            dateTime={b.dateTime}
            status={b.status}
            totalLabel={b.totalLabel}
            onSendReminder={
              b.status === 'awaiting_payment'
                ? () => alert('Reminder — wire to notifications')
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
