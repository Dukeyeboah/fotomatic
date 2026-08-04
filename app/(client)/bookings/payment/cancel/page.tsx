'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BookingPaymentCancelPage() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get('thread');

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Payment cancelled
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        No charge was made. You can return to your booking and pay when
        you&apos;re ready.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {threadId ? (
          <Link
            href={`/messages?thread=${encodeURIComponent(threadId)}`}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Back to booking
          </Link>
        ) : null}
        <Link
          href="/bookings"
          className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          All bookings
        </Link>
      </div>
    </div>
  );
}
