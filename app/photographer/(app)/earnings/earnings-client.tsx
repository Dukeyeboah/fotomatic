'use client';

import Link from 'next/link';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import {
  earningsChartPointsFromThreads,
  earningsMonthOverMonthDeltaPct,
  earningsThisMonthFromThreads,
  lifetimeEarningsFromThreads,
} from '@/lib/photographer-booking-dashboard';
import { PhotographerEarningsChart } from '@/components/photographer/photographer-earnings-chart';

export default function PhotographerEarningsClient() {
  const { threads, loading } = usePhotographerBookingThreads();
  const month = earningsThisMonthFromThreads(threads);
  const delta = earningsMonthOverMonthDeltaPct(threads);
  const lifetime = lifetimeEarningsFromThreads(threads);
  const points = earningsChartPointsFromThreads(threads);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">Earnings</h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Confirmed booking amounts from your Fotomatic jobs. Set up payouts in{' '}
        <Link
          href="/photographer/settings"
          className="font-semibold text-amber-900 underline"
        >
          Account settings
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-600">This month</p>
          <p className="mt-1 font-serif text-3xl text-zinc-900">
            {loading ? '…' : `$${month.toLocaleString()}`}
          </p>
          {!loading ? (
            <p
              className={`mt-1 text-sm font-semibold ${
                delta >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {delta >= 0 ? '+' : ''}
              {delta}% vs last month
            </p>
          ) : null}
          <div className="mt-4 rounded-xl bg-zinc-50 p-3">
            <PhotographerEarningsChart points={points} />
          </div>
        </div>
        <dl className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between border-b border-zinc-100 pb-3">
            <dt className="text-zinc-600">Lifetime (confirmed)</dt>
            <dd className="font-semibold text-zinc-900">
              {loading ? '…' : `$${lifetime.toLocaleString()}`}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Open booking requests</dt>
            <dd className="font-semibold text-zinc-900">
              {loading
                ? '…'
                : threads.filter((t) => t.status === 'requested').length}
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
