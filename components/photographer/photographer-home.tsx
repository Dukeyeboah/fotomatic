'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Clock,
  DollarSign,
  Star,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { BookingRequestModal } from '@/components/booking-request-modal';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { DashboardPhotographerCard } from '@/components/dashboard/dashboard-photographer-card';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import type { BookingThread } from '@/lib/firebase/booking-threads';
import {
  clientBookingAvatarUrl,
  countActiveUpcomingBookings,
  countOpenBookingRequests,
  earningsChartPointsFromThreads,
  earningsMonthOverMonthDeltaPct,
  earningsThisMonthFromThreads,
  formatThreadDateDisplay,
  lifetimeEarningsFromThreads,
  threadsToActivityFeedItems,
} from '@/lib/photographer-booking-dashboard';
import { PhotographerStatCard } from '@/components/photographer/photographer-stat-card';
import { PhotographerRequestCard } from '@/components/photographer/photographer-request-card';
import { PhotographerBookingRow } from '@/components/photographer/photographer-booking-row';
import { PhotographerActivityFeed } from '@/components/photographer/photographer-activity-feed';
import { PhotographerEarningsChart } from '@/components/photographer/photographer-earnings-chart';
import { PhotographerQuickActionGrid } from '@/components/photographer/photographer-quick-actions';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import { isValidPublicProfileSlug } from '@/lib/public-profile-slug';

function threadToBookingRowProps(thread: BookingThread) {
  const dateTime = [
    formatThreadDateDisplay(thread.eventDate),
    thread.eventTimeframe,
    thread.duration,
  ]
    .filter((x) => x && String(x).trim())
    .join(' · ');
  const status =
    thread.status === 'accepted_pending_payment'
      ? ('awaiting_payment' as const)
      : thread.status === 'pending_client_response'
        ? ('awaiting_client' as const)
        : ('confirmed' as const);
  const totalLabel =
    typeof thread.acceptedTotalPrice === 'number' &&
    thread.acceptedTotalPrice > 0
      ? `$${thread.acceptedTotalPrice.toLocaleString()}`
      : undefined;
  return { dateTime, status, totalLabel };
}

export function PhotographerHome() {
  const { threads, loading: threadsLoading } = usePhotographerBookingThreads();
  const newRequests = countOpenBookingRequests(threads);
  const upcomingCount = countActiveUpcomingBookings(threads);
  const earningsMonth = earningsThisMonthFromThreads(threads);
  const earningsDeltaPct = earningsMonthOverMonthDeltaPct(threads);
  const lifetime = lifetimeEarningsFromThreads(threads);
  const chartPoints = earningsChartPointsFromThreads(threads);
  const activityItems = threadsToActivityFeedItems(threads);
  const openRequestThreads = threads.filter((t) => t.status === 'requested');
  const upcomingThreads = threads.filter((t) =>
    ['accepted_pending_payment', 'confirmed', 'pending_client_response'].includes(
      t.status,
    ),
  );
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const directory = useMergedDirectoryPhotographers();
  const { toggle, isSaved } = useSavedPhotographerIds();
  const [detailPhotographer, setDetailPhotographer] = useState<
    (typeof directory)[number] | null
  >(null);
  const [bookingPhotographer, setBookingPhotographer] = useState<
    (typeof directory)[number] | null
  >(null);

  const suggested = useMemo(() => {
    if (!user) return directory.slice(0, 8);
    const selfId = `p-${user.uid}`;
    return directory.filter((p) => p.id !== selfId).slice(0, 8);
  }, [directory, user]);

  const myPublicProfileHref = useMemo(() => {
    const raw = userData?.username?.trim();
    if (!raw || !isValidPublicProfileSlug(raw)) return '/photographer/profile';
    return publicPhotographerProfilePath(raw.toLowerCase());
  }, [userData?.username]);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PhotographerStatCard
          label="New Requests"
          valueDisplay={threadsLoading ? '…' : String(newRequests)}
          subtext="Awaiting your response"
          icon={Clock}
          tintClass="bg-[#f0e8dc]"
          viewHref="/photographer/requests"
          viewLabel="View requests"
          modalTitle="New requests"
          modalBody={
            <p>
              You have <strong>{newRequests}</strong> booking request
              {newRequests === 1 ? '' : 's'} waiting for a response. Open a request
              to accept, suggest a new time, or decline.
            </p>
          }
        />
        <PhotographerStatCard
          label="Upcoming Bookings"
          valueDisplay={threadsLoading ? '…' : String(upcomingCount)}
          subtext="Accepted or awaiting client"
          icon={CalendarClock}
          tintClass="bg-emerald-50/90"
          viewHref="/photographer/bookings"
          viewLabel="View bookings"
          modalTitle="Upcoming bookings"
          modalBody={
            <p>
              <strong>{upcomingCount}</strong> active booking
              {upcomingCount === 1 ? '' : 's'} (accepted, pending payment, or
              waiting on the client). Full details are on the Bookings page.
            </p>
          }
        />
        <PhotographerStatCard
          label="Earnings This Month"
          valueDisplay={
            threadsLoading ? '…' : `$${earningsMonth.toLocaleString()}`
          }
          subtext="From accepted quotes"
          icon={DollarSign}
          tintClass="bg-sky-50/90"
          viewHref="/photographer/earnings"
          viewLabel="View earnings"
          modalTitle="Earnings this month"
          modalBody={
            <p>
              Total of accepted quote amounts (this calendar month) from your
              booking threads:{' '}
              <strong>${earningsMonth.toLocaleString()}</strong>. Payouts will
              reconcile here when payments go live.
            </p>
          }
        />
        <PhotographerStatCard
          label="Rating"
          valueDisplay="—"
          subtext="Reviews not enabled yet"
          icon={Star}
          tintClass="bg-violet-50/90"
          viewHref="/photographer/reviews"
          viewLabel="View reviews"
          modalTitle="Your rating"
          modalBody={
            <p>
              Public client reviews are not enabled yet. When they are, your
              average rating will appear here.
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
              {threadsLoading ? (
                <p className="text-sm text-zinc-500">Loading requests…</p>
              ) : openRequestThreads.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-600">
                  No open requests. New client booking requests appear here and in{' '}
                  <Link
                    href="/photographer/bookings"
                    className="font-semibold text-amber-900 underline"
                  >
                    Bookings inbox
                  </Link>
                  .
                </p>
              ) : (
                openRequestThreads.slice(0, 4).map((t) => (
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
              {threadsLoading ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Loading bookings…
                </p>
              ) : upcomingThreads.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-600">
                  No upcoming sessions yet. Accepted bookings will show here.
                </p>
              ) : (
                upcomingThreads.slice(0, 6).map((t) => {
                  const row = threadToBookingRowProps(t);
                  return (
                    <PhotographerBookingRow
                      key={t.id}
                      clientName={t.clientName}
                      shootType={t.eventType}
                      dateTime={row.dateTime}
                      status={row.status}
                      totalLabel={row.totalLabel}
                      onSendReminder={
                        row.status === 'awaiting_payment'
                          ? () => {
                              window.location.href = `/photographer/bookings?thread=${encodeURIComponent(t.id ?? '')}`;
                            }
                          : undefined
                      }
                    />
                  );
                })
              )}
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
                href="/photographer/bookings"
                className="text-sm font-semibold text-amber-900 hover:underline"
              >
                Open bookings inbox →
              </Link>
            </div>
            <div className="mt-2">
              {activityItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">
                  No recent booking activity yet.
                </p>
              ) : (
                <PhotographerActivityFeed items={activityItems} />
              )}
            </div>
            <Link
              href="/photographer/bookings"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              Bookings inbox
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-lg font-medium text-zinc-900">
              Earnings overview
            </h2>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-serif text-2xl font-medium text-zinc-900">
                ${earningsMonth.toLocaleString()}
              </p>
              <span
                className={`text-sm font-semibold ${
                  earningsDeltaPct >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {earningsDeltaPct >= 0 ? '+' : ''}
                {earningsDeltaPct}% vs last month
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Based on accepted totals in your booking threads
            </p>
            <div className="mt-4 rounded-xl bg-zinc-50/80 p-3 ring-1 ring-zinc-100">
              <PhotographerEarningsChart points={chartPoints} />
            </div>
            <dl className="mt-4 space-y-3 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Awaiting payment (quotes)</dt>
                <dd className="font-semibold text-zinc-900">
                  $
                  {Math.round(
                    threads
                      .filter((t) => t.status === 'accepted_pending_payment')
                      .reduce(
                        (acc, t) =>
                          acc +
                          (typeof t.acceptedTotalPrice === 'number'
                            ? t.acceptedTotalPrice
                            : 0),
                        0,
                      ),
                  ).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Accepted / confirmed (all time)</dt>
                <dd className="font-semibold text-zinc-900">
                  ${lifetime.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Open requests</dt>
                <dd className="font-semibold text-zinc-900">{newRequests}</dd>
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-xl font-medium text-zinc-900">
            Find a photographer
          </h2>
          <Link
            href="/photographer/directory"
            className="text-sm font-semibold text-amber-900 hover:underline"
          >
            Browse all photographers →
          </Link>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Discover other professionals on Fotomatic—open a profile for details or
          request a booking.
        </p>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggested.length === 0 ? (
            <div className="min-w-0 flex-1 rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center text-sm text-zinc-600">
              No other photographers are listed yet.{' '}
              <Link
                href="/photographer/directory"
                className="font-semibold text-amber-900 underline"
              >
                Open the directory
              </Link>
              .
            </div>
          ) : (
            suggested.map((p) => (
              <DashboardPhotographerCard
                key={p.id}
                photographer={p}
                saved={isSaved(p.id)}
                onToggleSave={() => toggle(p.id)}
                onOpenDetail={() => setDetailPhotographer(p)}
                showRequestBooking={
                  !isOwnDirectoryPhotographerListing(p, {
                    uid: user?.uid,
                    role: userData?.role,
                    directoryId: userData?.photographer?.directoryId,
                  })
                }
                onRequestBooking={() => {
                  if (!user) {
                    openLoginModal({ redirectTo: '/photographer' });
                    return;
                  }
                  setBookingPhotographer(p);
                }}
              />
            ))
          )}
        </div>
      </section>

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
          href={myPublicProfileHref}
          className="shrink-0 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          View My Profile
        </Link>
      </div>

      <PhotographerPublicDetailModal
        photographer={detailPhotographer}
        open={detailPhotographer != null}
        onClose={() => setDetailPhotographer(null)}
        onRequestBooking={(p) => {
          setDetailPhotographer(null);
          if (!user) {
            openLoginModal({ redirectTo: '/photographer' });
            return;
          }
          setBookingPhotographer(p);
        }}
        saved={detailPhotographer ? isSaved(detailPhotographer.id) : false}
        onToggleSave={() => {
          if (detailPhotographer) toggle(detailPhotographer.id);
        }}
        user={user}
        openLoginModal={(o) => openLoginModal(o)}
        canRequestBooking={
          detailPhotographer
            ? !isOwnDirectoryPhotographerListing(detailPhotographer, {
                uid: user?.uid,
                role: userData?.role,
                directoryId: userData?.photographer?.directoryId,
              })
            : true
        }
      />

      {user && bookingPhotographer ? (
        <BookingRequestModal
          photographer={bookingPhotographer}
          user={user}
          userData={userData}
          onClose={() => setBookingPhotographer(null)}
        />
      ) : null}
    </div>
  );
}
