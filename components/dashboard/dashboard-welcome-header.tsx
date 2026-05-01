import Link from 'next/link';
import { Search } from 'lucide-react';

export function DashboardWelcomeHeader({
  firstName,
}: {
  firstName: string;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl">
          Welcome back, {firstName}! 👋
        </h1>
        <p className="mt-2 text-zinc-600">
          Here&apos;s what&apos;s happening with your bookings.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/photographers"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          Find a Photographer
        </Link>
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          View All Bookings
        </Link>
      </div>
    </div>
  );
}
