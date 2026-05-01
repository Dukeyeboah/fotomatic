'use client';

import Link from 'next/link';
import {
  CalendarClock,
  Clock,
  DollarSign,
  Star,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  MOCK_ACTIVITY,
  MOCK_PHOTOGRAPHER_STATS,
  MOCK_REQUESTS,
  MOCK_UPCOMING_BOOKINGS,
} from '@/lib/photographer-dashboard-mock';
import { PhotographerStatCard } from '@/components/photographer/photographer-stat-card';
import { PhotographerRequestCard } from '@/components/photographer/photographer-request-card';
import { PhotographerBookingRow } from '@/components/photographer/photographer-booking-row';
import { PhotographerActivityFeed } from '@/components/photographer/photographer-activity-feed';
import { PhotographerEarningsChart } from '@/components/photographer/photographer-earnings-chart';
import { PhotographerQuickActionGrid } from '@/components/photographer/photographer-quick-actions';

export function PhotographerHome() {
  const s = MOCK_PHOTOGRAPHER_STATS;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhotographerStatCard
          label="New Requests"
          valueDisplay={String(s.newRequests)}
          subtext="Awaiting your response"
          icon={Clock}
          tintClass="bg-[#f0e8dc]"
          viewHref="/photographer/requests"
          viewLabel="View requests"
          modalTitle="New requests"
          modalBody={
            <p>
              You have <strong>{s.newRequests}</strong> booking requests waiting
              for a response. Review details, accept, suggest a new time, or
              decline from the Requests page.
            </p>
          }
        />
        <PhotographerStatCard
          label="Upcoming Bookings"
          valueDisplay={String(s.upcomingBookings)}
          subtext="Confirmed or pending"
          icon={CalendarClock}
          tintClass="bg-emerald-50/90"
          viewHref="/photographer/bookings"
          viewLabel="View bookings"
          modalTitle="Upcoming bookings"
          modalBody={
            <p>
              <strong>{s.upcomingBookings}</strong> sessions are on your
              calendar as confirmed or pending payment. Open Bookings for full
              schedules and client notes.
            </p>
          }
        />
        <PhotographerStatCard
          label="Earnings This Month"
          valueDisplay={`$${s.earningsThisMonth.toLocaleString()}`}
          subtext="Total earnings"
          icon={DollarSign}
          tintClass="bg-sky-50/90"
          viewHref="/photographer/earnings"
          viewLabel="View earnings"
          modalTitle="Earnings this month"
          modalBody={
            <p>
              Mock snapshot: <strong>${s.earningsThisMonth.toLocaleString()}</strong>{' '}
              booked revenue this month. Connect your payout account in Earnings
              when payouts go live.
            </p>
          }
        />
        <PhotographerStatCard
          label="Rating"
          valueDisplay={`${s.rating}`}
          subtext={`From ${s.reviewCount} reviews`}
          icon={Star}
          tintClass="bg-violet-50/90"
          viewHref="/photographer/reviews"
          viewLabel="View reviews"
          modalTitle="Your rating"
          modalBody={
            <p>
              Average <strong>{s.rating}</strong> across{' '}
              <strong>{s.reviewCount}</strong> reviews (sample data). Client
              feedback will appear here once reviews are enabled.
            </p>
          }
        />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <section className="space-y-10 lg:col-span-3">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-serif text-xl font-medium text-zinc-900">
                Requests requiring your response
              </h2>
              <Link
                href="/photographer/requests"
                className="text-sm font-semibold text-amber-900 hover:underline"
              >
                View all requests →
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {MOCK_REQUESTS.map((r) => (
                <PhotographerRequestCard
                  key={r.id}
                  clientName={r.clientName}
                  clientImage={r.clientImage}
                  shootType={r.shootType}
                  location={r.location}
                  date={r.date}
                  duration={r.duration}
                  onAccept={() =>
                    alert('Accept flow will connect to your booking tools.')
                  }
                  onSuggest={() =>
                    alert('Suggest time will open your scheduling flow.')
                  }
                  onDecline={() =>
                    alert('Decline flow will connect to your booking tools.')
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-serif text-xl font-medium text-zinc-900">
                Upcoming bookings
              </h2>
              <Link
                href="/photographer/bookings"
                className="text-sm font-semibold text-amber-900 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="mt-4 rounded-2xl border border-zinc-200/90 bg-white px-4 shadow-sm">
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
                      ? () => alert('Reminder: connect email or SMS when live.')
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-serif text-lg font-medium text-zinc-900">
                Recent activity
              </h2>
              <Link
                href="/photographer/messages"
                className="text-sm font-semibold text-amber-900 hover:underline"
              >
                View all messages →
              </Link>
            </div>
            <div className="mt-2">
              <PhotographerActivityFeed items={MOCK_ACTIVITY} />
            </div>
            <Link
              href="/photographer/messages"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              Go to Messages
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-lg font-medium text-zinc-900">
              Earnings overview
            </h2>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-serif text-2xl font-medium text-zinc-900">
                ${s.earningsThisMonth.toLocaleString()}
              </p>
              <span className="text-sm font-semibold text-emerald-700">
                +{s.earningsDeltaPct}% vs last month
              </span>
            </div>
            <p className="text-xs text-zinc-500">Sample trend (May)</p>
            <div className="mt-4 rounded-xl bg-zinc-50/80 p-3 ring-1 ring-zinc-100">
              <PhotographerEarningsChart />
            </div>
            <dl className="mt-4 space-y-3 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Upcoming payout</dt>
                <dd className="font-semibold text-zinc-900">
                  ${s.upcomingPayout.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Completed bookings</dt>
                <dd className="font-semibold text-zinc-900">
                  ${s.completedBookingsTotal.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Total earnings</dt>
                <dd className="font-semibold text-zinc-900">
                  ${s.lifetimeEarnings.toLocaleString()}
                </dd>
              </div>
            </dl>
            <Link
              href="/photographer/earnings"
              className="mt-4 inline-block text-sm font-semibold text-amber-900 hover:underline"
            >
              Open earnings →
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-xl font-medium text-zinc-900">
          Quick actions
        </h2>
        <div className="mt-4">
          <PhotographerQuickActionGrid />
        </div>
      </section>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 px-5 py-5 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-zinc-900/5">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-medium text-zinc-900">
              You&apos;re all set! Your profile is visible and active.
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">
              Keep your portfolio and availability updated for the best client
              matches.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="shrink-0 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          View My Profile
        </Link>
      </div>
    </div>
  );
}
