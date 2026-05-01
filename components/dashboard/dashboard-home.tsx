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
import { StatCard } from '@/components/dashboard/stat-card';
import { DashboardWelcomeHeader } from '@/components/dashboard/dashboard-welcome-header';
import { DashboardBookingCard } from '@/components/dashboard/booking-card';
import { UpdateItem } from '@/components/dashboard/update-item';
import { DashboardPhotographerCard } from '@/components/dashboard/dashboard-photographer-card';
import { InfoStrip } from '@/components/dashboard/info-strip';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  Headphones,
  Shield,
  Lock,
} from 'lucide-react';

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

function firstNameFromAuth(
  userData: ReturnType<typeof useAuth>['userData'],
  displayName: string | null,
  email: string | null,
): string {
  const raw =
    userData?.displayName?.trim() ||
    displayName?.trim() ||
    email?.split('@')[0] ||
    'there';
  return raw.split(/\s+/)[0] || 'there';
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

export function DashboardHome() {
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const directory = useMergedDirectoryPhotographers();
  const [bookingPhotographer, setBookingPhotographer] = useState<
    (typeof directory)[number] | null
  >(null);
  const { toggle, isSaved } = useSavedPhotographerIds();

  const suggested = useMemo(() => directory.slice(0, 8), [directory]);

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

  const firstName = user
    ? firstNameFromAuth(userData, user.displayName, user.email)
    : 'there';

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <DashboardWelcomeHeader firstName={firstName} />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="font-serif text-xl font-medium text-zinc-900">
            Your Bookings
          </h2>
          <div className="mt-4 space-y-3">
            {bookingPreview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center text-sm text-zinc-600">
                No bookings yet.{' '}
                <Link
                  href="/dashboard/photographers"
                  className="font-semibold text-amber-900 underline"
                >
                  Find a photographer
                </Link>
              </div>
            ) : (
              bookingPreview.map((t) => (
                <DashboardBookingCard
                  key={t.id}
                  thread={t}
                  messagesHref="/dashboard/messages"
                />
              ))
            )}
          </div>
        </section>

        <section className="lg:col-span-2">
          <h2 className="font-serif text-xl font-medium text-zinc-900">
            Recent Updates
          </h2>
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
              href="/dashboard/messages"
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100"
            >
              Go to Messages
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-serif text-xl font-medium text-zinc-900">
            Photographers you might like
          </h2>
          <Link
            href="/dashboard/photographers"
            className="text-sm font-semibold text-amber-900 hover:underline"
          >
            Browse all photographers →
          </Link>
        </div>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggested.map((p) => (
            <DashboardPhotographerCard
              key={p.id}
              photographer={p}
              saved={isSaved(p.id)}
              onToggleSave={() => toggle(p.id)}
              onRequestBooking={() => {
                if (!user) {
                  openLoginModal({ redirectTo: '/dashboard' });
                  return;
                }
                setBookingPhotographer(p);
              }}
            />
          ))}
        </div>
      </section>

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
