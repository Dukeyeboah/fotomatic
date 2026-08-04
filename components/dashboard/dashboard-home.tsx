'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  subscribeNotifications,
  subscribeThreadsForClient,
  type AppNotification,
  type BookingThread,
} from '@/lib/firebase/booking-threads';
import { computeClientBookingStats } from '@/lib/client-booking-stats';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { BookingRequestModal } from '@/components/booking-request-modal';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { StatCard } from '@/components/dashboard/stat-card';
import { DashboardBookingCard } from '@/components/dashboard/booking-card';
import { UpdateItem } from '@/components/dashboard/update-item';
import { DashboardPhotographerCard } from '@/components/dashboard/dashboard-photographer-card';
import { InfoStrip } from '@/components/dashboard/info-strip';
import { useDashboardApplyAsPhotographer } from '@/components/dashboard/dashboard-apply-photographer-context';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { usePhotographerDirectoryReviewStats } from '@/lib/hooks/use-directory-review-stats';
import { MarketingImage } from '@/components/marketing-image';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  Headphones,
  Lock,
  Shield,
} from 'lucide-react';

type HomeTab = 'quick' | 'bookings' | 'updates';

function firestoreMs(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}

function notificationDotClass(type: AppNotification['type']): string {
  switch (type) {
    case 'booking_accepted':
      return 'bg-emerald-500';
    case 'booking_declined':
      return 'bg-zinc-400';
    case 'booking_suggested':
      return 'bg-amber-500';
    case 'new_message':
      return 'bg-sky-500';
    default:
      return 'bg-amber-700';
  }
}

const TABS: ReadonlyArray<{ id: HomeTab; label: string }> = [
  { id: 'quick', label: 'Quick view' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'updates', label: 'Updates' },
];

export function DashboardHome() {
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const openApplyAsPhotographer = useDashboardApplyAsPhotographer();
  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [homeTab, setHomeTab] = useState<HomeTab>('quick');
  const directory = useMergedDirectoryPhotographers();
  const [bookingPhotographer, setBookingPhotographer] = useState<
    (typeof directory)[number] | null
  >(null);
  const [detailPhotographer, setDetailPhotographer] = useState<
    (typeof directory)[number] | null
  >(null);
  const { toggle, isSaved } = useSavedPhotographerIds();
  const reviewStats = usePhotographerDirectoryReviewStats();

  const suggested = useMemo(() => {
    let list = directory;
    if (user && userData?.role === 'photographer') {
      list = list.filter(
        (p) =>
          !isOwnDirectoryPhotographerListing(p, {
            uid: user.uid,
            role: userData.role,
            directoryId: userData.photographer?.directoryId,
          }),
      );
    }
    return list.slice(0, 8);
  }, [directory, user, userData]);

  useEffect(() => {
    if (!user) return;
    return subscribeThreadsForClient(user.uid, setThreads);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setNotifications);
  }, [user]);

  const stats = useMemo(() => computeClientBookingStats(threads), [threads]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort(
      (a, b) => firestoreMs(b.updatedAt) - firestoreMs(a.updatedAt),
    );
  }, [threads]);

  const bookingPreview = sortedThreads.slice(0, 6);

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => firestoreMs(b.createdAt) - firestoreMs(a.createdAt),
    );
  }, [notifications]);

  const recentUpdates = sortedNotifications.slice(0, 8);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <section>
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-xl font-medium text-zinc-900">
            Photographers you might like
          </h2>
          <Link
            href="/photographers"
            className="text-sm font-medium text-amber-900/90 underline-offset-4 hover:underline"
          >
            Browse all →
          </Link>
        </div>
        <div className="mt-5 flex justify-center">
          <div className="flex max-w-5xl gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggested.map((p) => (
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
                    openLoginModal({ redirectTo: '/photographers' });
                    return;
                  }
                  setBookingPhotographer(p);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-1 border-b border-zinc-200/90">
        {TABS.map((tab) => {
          const active = homeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHomeTab(tab.id)}
              className={`relative -mb-px cursor-pointer px-3 py-2.5 text-sm transition-colors sm:px-4 ${
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
        {homeTab === 'quick' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pending Responses"
              count={stats.pendingResponses}
              subtext="Awaiting photographer response"
              icon={Clock}
              tintClass="bg-[#f0e8dc]"
            />
            <StatCard
              label="Accepted"
              count={stats.acceptedPendingPayment}
              subtext="Payment required"
              icon={CheckCircle2}
              tintClass="bg-emerald-50/90"
            />
            <StatCard
              label="Confirmed"
              count={stats.confirmedUpcoming}
              subtext="Upcoming bookings"
              icon={CalendarClock}
              tintClass="bg-sky-50/90"
            />
            <StatCard
              label="Past Bookings"
              count={stats.pastBookings}
              subtext="Completed or closed"
              icon={History}
              tintClass="bg-zinc-100/90"
            />
          </div>
        ) : null}

        {homeTab === 'bookings' ? (
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl font-medium text-zinc-900">
                Your Bookings
              </h2>
              <Link
                href="/bookings"
                className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                View all bookings
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {bookingPreview.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center text-sm text-zinc-600">
                  No bookings yet.{' '}
                  <Link
                    href="/photographers"
                    className="font-medium text-amber-900 underline-offset-4 hover:underline"
                  >
                    Find a photographer
                  </Link>
                </div>
              ) : (
                bookingPreview.map((t) => (
                  <DashboardBookingCard
                    key={t.id}
                    thread={t}
                    messagesHref="/messages"
                  />
                ))
              )}
            </div>
          </section>
        ) : null}

        {homeTab === 'updates' ? (
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl font-medium text-zinc-900">
                Recent Updates
              </h2>
              <Link
                href="/messages"
                className="text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 rounded-2xl border border-zinc-200/90 bg-white p-2 shadow-sm">
              {recentUpdates.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-zinc-600">
                  No updates yet. Booking activity will show up here.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {recentUpdates.map((n) => (
                    <li key={n.id}>
                      <UpdateItem
                        name={n.title}
                        message={n.body}
                        createdAt={n.createdAt}
                        dotClass={notificationDotClass(n.type)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/messages"
                className="mt-2 flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
              >
                Go to Messages
              </Link>
            </div>
          </section>
        ) : null}
      </div>

      {userData?.role !== 'photographer' ? (
        <section className="mt-10 overflow-hidden rounded-2xl border border-zinc-200/90 bg-[#faf8f5] shadow-sm ring-1 ring-zinc-900/5 sm:mt-12">
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="relative hidden w-36 shrink-0 overflow-hidden sm:block lg:w-44">
              <MarketingImage
                file="photographer1.jpeg"
                alt=""
                fill
                className="object-cover"
                sizes="176px"
              />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-5 text-center sm:px-8 sm:py-6 sm:text-left sm:items-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900/75">
                  For photographers
                </p>
                <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-zinc-900 sm:text-2xl">
                  Want to be a Fotomatic photographer?
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-600">
                  Apply once from your dashboard. After approval you get a public
                  profile, booking requests, and tools to manage clients.
                </p>
              </div>
              <button
                type="button"
                onClick={openApplyAsPhotographer}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                Apply to join
              </button>
            </div>

            <div className="relative hidden w-36 shrink-0 overflow-hidden sm:block lg:w-44">
              <MarketingImage
                file="photographer2.jpeg"
                alt=""
                fill
                className="object-cover object-top"
                sizes="176px"
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-6 sm:mt-8">
      <InfoStrip
        items={[
          {
            icon: Shield,
            title: 'Trusted Professionals',
            description:
              'Vetted photographers focused on reliability and beautiful results.',
          },
          {
            icon: Lock,
            title: 'Secure Payments',
            description:
              'Payments and confirmations are being wired for a safe checkout flow.',
          },
          {
            icon: Headphones,
            title: 'Support You Can Count On',
            description:
              'Reach our team anytime—visit Help / Support in your account menu.',
          },
        ]}
      />
      </div>

      <PhotographerPublicDetailModal
        photographer={detailPhotographer}
        open={detailPhotographer != null}
        onClose={() => setDetailPhotographer(null)}
        onRequestBooking={(p) => {
          setDetailPhotographer(null);
          if (!user) {
            openLoginModal({ redirectTo: '/photographers' });
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
