import Link from 'next/link';

export default function PhotographerMessagesPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Messages
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Booking conversations and thread messages live in your bookings inbox.
        Open a booking there to read the timeline and reply to clients.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/photographer/bookings"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Open bookings inbox
        </Link>
        <Link
          href="/photographer"
          className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
