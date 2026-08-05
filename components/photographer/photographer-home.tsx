'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Clock,
  DollarSign,
  Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { usePhotographerDirectoryReviewStats } from '@/lib/hooks/use-directory-review-stats';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { BookingRequestModal } from '@/components/booking-request-modal';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { DashboardPhotographerCard } from '@/components/dashboard/dashboard-photographer-card';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import type { BookingThread } from '@/lib/firebase/booking-threads';
import {
  countActiveUpcomingBookings,
  countOpenBookingRequests,
  earningsChartPointsFromThreads,
  earningsMonthOverMonthDeltaPct,
  earningsThisMonthFromThreads,
  formatThreadDateDisplay,
  lifetimeEarningsFromThreads,
  threadsToActivityFeedItems,
  effectivePhotographerDirectoryId,
} from '@/lib/photographer-booking-dashboard';
import { PhotographerStatCard } from '@/components/photographer/photographer-stat-card';
import { PhotographerBookingRow } from '@/components/photographer/photographer-booking-row';
import { PhotographerActivityFeed } from '@/components/photographer/photographer-activity-feed';
import { PhotographerEarningsChart } from '@/components/photographer/photographer-earnings-chart';
import { PhotographerReviewsPanel } from '@/components/photographer-reviews-panel';
import { PhotographerQuickActionGrid } from '@/components/photographer/photographer-quick-actions';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import { isValidPublicProfileSlug } from '@/lib/public-profile-slug';

type HomeTab =
  | 'overview'
  | 'bookings'
  | 'activity'
  | 'earnings'
  | 'reviews';

const TABS: ReadonlyArray<{ id: HomeTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Upcoming bookings' },
  { id: 'activity', label: 'Recent activity' },
  { id: 'earnings', label: 'Earnings overview' },
  { id: 'reviews', label: 'Reviews' },
];

const PANEL_SCROLL =
  'max-h-[320px] overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white shadow-sm';

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
  const upcomingThreads = threads.filter((t) =>
    ['accepted_pending_payment', 'confirmed', 'pending_client_response'].includes(
      t.status,
    ),
  );
  const awaitingPaymentTotal = Math.round(
    threads
      .filter((t) => t.status === 'accepted_pending_payment')
      .reduce(
        (acc, t) =>
          acc +
          (typeof t.acceptedTotalPrice === 'number' ? t.acceptedTotalPrice : 0),
        0,
      ),
  );
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const directory = useMergedDirectoryPhotographers();
  const { toggle, isSaved } = useSavedPhotographerIds();
  const reviewStats = usePhotographerDirectoryReviewStats();
  const [homeTab, setHomeTab] = useState<HomeTab>('overview');
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

  const myListingId = useMemo(
    () =>
      user
        ? effectivePhotographerDirectoryId(
            user.uid,
            userData?.photographer?.directoryId,
          )
        : '',
    [user, userData?.photographer?.directoryId],
  );
  const myReviewAgg = myListingId ? reviewStats.get(myListingId) : undefined;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={myPublicProfileHref}
          className="text-sm font-medium text-amber-900 underline-offset-4 hover:underline"
        >
          View my profile
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-1 border-b border-zinc-200/90">
        {TABS.map((tab) => {
          const active = homeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHomeTab(tab.id)}
              className={`relative -mb-px cursor-pointer px-2.5 py-2.5 text-sm transition-colors sm:px-3.5 ${
                active
                  ? 'font-medium text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-900" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {homeTab === 'overview' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PhotographerStatCard
              label="New Requests"
              valueDisplay={threadsLoading ? '…' : String(newRequests)}
              subtext="Awaiting your response"
              icon={Clock}
              tintClass="bg-[#f0e8dc]"
              viewHref="/photographer/bookings"
              viewLabel="View requests"
              modalTitle="New requests"
              modalBody={
                <p>
                  You have <strong>{newRequests}</strong> booking request
                  {newRequests === 1 ? '' : 's'} waiting for a response. Open a
                  request to accept, suggest a new time, or decline.
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
              subtext="Confirmed (paid) bookings only"
              icon={DollarSign}
              tintClass="bg-sky-50/90"
              viewHref="/photographer/earnings"
              viewLabel="View earnings"
              modalTitle="Earnings this month"
              modalBody={
                <p>
                  Total of confirmed booking amounts (this calendar month).
                  Quotes that are only accepted or awaiting payment are not
                  counted until checkout marks the booking as confirmed:{' '}
                  <strong>${earningsMonth.toLocaleString()}</strong>.
                </p>
              }
            />
            <PhotographerStatCard
              label="Rating"
              valueDisplay={
                myReviewAgg && myReviewAgg.count > 0
                  ? `${myReviewAgg.average.toFixed(1)} ★`
                  : '—'
              }
              subtext={
                myReviewAgg && myReviewAgg.count > 0
                  ? `${myReviewAgg.count} client review${myReviewAgg.count === 1 ? '' : 's'}`
                  : 'No reviews yet'
              }
              icon={Star}
              tintClass="bg-violet-50/90"
              viewHref="/photographer/profile"
              viewLabel="Edit profile"
              modalTitle="Your rating"
              modalBody={
                <p>
                  Average from client reviews on your public listing. Encourage
                  happy clients to leave a star rating from your profile page or
                  the directory.
                </p>
              }
            />
          </div>
        ) : null}

        {homeTab === 'bookings' ? (
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
            <div className={`mt-4 px-4 ${PANEL_SCROLL}`}>
              {threadsLoading ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Loading bookings…
                </p>
              ) : upcomingThreads.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-600">
                  No upcoming sessions yet. Accepted bookings will show here.
                </p>
              ) : (
                upcomingThreads.slice(0, 8).map((t) => {
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
        ) : null}

        {homeTab === 'earnings' ? (
          <div className={`p-5 sm:p-6 ${PANEL_SCROLL}`}>
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
              Based on confirmed booking amounts this month
            </p>
            <div className="mt-4 rounded-xl bg-zinc-50/80 p-3 ring-1 ring-zinc-100">
              <PhotographerEarningsChart points={chartPoints} />
            </div>
            <dl className="mt-4 space-y-3 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">Awaiting payment (quotes)</dt>
                <dd className="font-semibold text-zinc-900">
                  ${awaitingPaymentTotal.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-600">
                  Accepted / confirmed (all time)
                </dt>
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
        ) : null}

        {homeTab === 'activity' ? (
          <div>
            <h2 className="font-serif text-xl font-medium text-zinc-900">
              Recent activity
            </h2>
            <div className={`mt-4 p-4 sm:p-5 ${PANEL_SCROLL}`}>
              {activityItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">
                  No recent booking activity yet.
                </p>
              ) : (
                <PhotographerActivityFeed items={activityItems} />
              )}
            </div>
          </div>
        ) : null}

        {homeTab === 'reviews' ? (
          myListingId ? (
            <div className={`p-4 sm:p-5 ${PANEL_SCROLL}`}>
              <h2 className="font-serif text-lg font-medium text-zinc-900">
                Your reviews
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                What clients submit from your public profile or the directory.
              </p>
              <div className="mt-4">
                <PhotographerReviewsPanel
                  photographerDirectoryId={myListingId}
                  photographerDisplayName={
                    userData?.displayName?.trim() ||
                    userData?.username?.trim() ||
                    'Your listing'
                  }
                  viewer={user}
                  viewerDisplayName={
                    userData?.displayName?.trim() ||
                    userData?.username?.trim() ||
                    null
                  }
                  isSelf
                  onNeedLogin={() => {}}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-600">
              Finish setting up your public profile to collect reviews.{' '}
              <Link
                href="/photographer/profile"
                className="font-semibold text-amber-900 underline"
              >
                Edit profile
              </Link>
            </p>
          )
        ) : null}
      </div>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-medium text-zinc-900">
          Quick actions
        </h2>
        <div className="mt-3">
          <PhotographerQuickActionGrid />
        </div>
      </section>

      <section className="mt-10">
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
          Discover other professionals on Fotomatic—open a profile for details
          or request a booking.
        </p>
        <div className="mt-6 flex justify-center">
          <div className="flex max-w-5xl gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  reviewSummary={reviewStats.get(p.id)}
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
        </div>
      </section>

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
