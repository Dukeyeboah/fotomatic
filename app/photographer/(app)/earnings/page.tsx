import Link from 'next/link';
import { MOCK_PHOTOGRAPHER_STATS } from '@/lib/photographer-dashboard-mock';
import { PhotographerEarningsChart } from '@/components/photographer/photographer-earnings-chart';

export default function PhotographerEarningsPage() {
  const s = MOCK_PHOTOGRAPHER_STATS;
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Earnings
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Mock figures for layout — replace with payouts and reports later.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-600">This month</p>
          <p className="mt-1 font-serif text-3xl text-zinc-900">
            ${s.earningsThisMonth.toLocaleString()}
          </p>
          <div className="mt-4 rounded-xl bg-zinc-50 p-3">
            <PhotographerEarningsChart />
          </div>
        </div>
        <dl className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between border-b border-zinc-100 pb-3">
            <dt className="text-zinc-600">Upcoming payout</dt>
            <dd className="font-semibold text-zinc-900">
              ${s.upcomingPayout.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between border-b border-zinc-100 pb-3">
            <dt className="text-zinc-600">Completed bookings</dt>
            <dd className="font-semibold text-zinc-900">
              ${s.completedBookingsTotal.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Lifetime</dt>
            <dd className="font-semibold text-zinc-900">
              ${s.lifetimeEarnings.toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
      <Link
        href="/photographer"
        className="mt-8 inline-block text-sm font-semibold text-amber-900 hover:underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
