'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  subscribeAdminEvents,
  subscribeRecentThreads,
  subscribeAllUsersForAdmin,
  type AdminEvent,
} from '@/lib/firebase/admin';
import type { BookingThread } from '@/lib/firebase/booking-threads';
import type { UserData } from '@/lib/firebase/user-profile';
import {
  subscribeSupportInboxForAdmin,
  markSupportInboxRead,
  type SupportInboxMessage,
} from '@/lib/firebase/support-inbox';
import {
  computeAdminDashboardMetrics,
  computeTopPhotographers,
} from '@/lib/admin-dashboard-metrics';
import { subscribePhotographersDirectory } from '@/lib/firebase/photographers-directory-admin';
import type { Photographer } from '@/lib/firebase/firestore';
import { AdminStatCard } from '@/components/admin/admin-stat-card';
import {
  AdminBookingsLineChart,
  AdminRevenueBarChart,
} from '@/components/admin/admin-charts';
import { AdminBookingRequestItem } from '@/components/admin/admin-booking-request-item';
import { AdminSupportMessageItem } from '@/components/admin/admin-support-message-item';
import { AdminActivityFeed } from '@/components/admin/admin-activity-feed';
import { AdminTopPhotographersTable } from '@/components/admin/admin-top-photographers-table';
import {
  CalendarCheck,
  DollarSign,
  Users,
  Camera,
  Inbox,
  Activity,
} from 'lucide-react';

export function AdminDashboardHome() {
  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [directory, setDirectory] = useState<Photographer[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [support, setSupport] = useState<SupportInboxMessage[]>([]);

  useEffect(() => {
    const u1 = subscribeRecentThreads(setThreads);
    const u2 = subscribeAllUsersForAdmin(setUsers);
    const u3 = subscribePhotographersDirectory(setDirectory);
    const u4 = subscribeAdminEvents(setEvents);
    const u5 = subscribeSupportInboxForAdmin(setSupport);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
    };
  }, []);

  const metrics = useMemo(
    () =>
      computeAdminDashboardMetrics(threads, users, directory.length),
    [threads, users, directory.length],
  );

  const topPhotogs = useMemo(() => computeTopPhotographers(threads), [threads]);

  const recentRequests = useMemo(() => {
    return [...threads]
      .filter((t) => t.status === 'requested')
      .sort((a, b) => {
        const ma =
          a.updatedAt && typeof a.updatedAt === 'object' && 'toMillis' in a.updatedAt
            ? (a.updatedAt as { toMillis: () => number }).toMillis()
            : 0;
        const mb =
          b.updatedAt && typeof b.updatedAt === 'object' && 'toMillis' in b.updatedAt
            ? (b.updatedAt as { toMillis: () => number }).toMillis()
            : 0;
        return mb - ma;
      })
      .slice(0, 6);
  }, [threads]);

  const activityEvents = useMemo(
    () => events.filter((e) => e.type !== 'photographer_application').slice(0, 8),
    [events],
  );

  const supportPreview = support.slice(0, 5);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total bookings"
          value={metrics.totalBookings}
          deltaPct={metrics.totalBookingsDeltaPct}
          icon={CalendarCheck}
          tintClass="bg-sky-50/90"
        />
        <AdminStatCard
          label="Revenue (this week)"
          value={metrics.revenueThisWeek}
          deltaPct={metrics.revenueDeltaPct}
          icon={DollarSign}
          tintClass="bg-emerald-50/90"
          valueIsCurrency
        />
        <AdminStatCard
          label="Active photographers"
          value={metrics.activePhotographers}
          deltaPct={metrics.photographersDeltaPct}
          icon={Camera}
          tintClass="bg-violet-50/90"
        />
        <AdminStatCard
          label="New users (this week)"
          value={metrics.newUsersThisWeek}
          deltaPct={metrics.newUsersDeltaPct}
          icon={Users}
          tintClass="bg-amber-50/90"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Bookings overview</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Mock trend — this week vs last week
          </p>
          <div className="mt-4">
            <AdminBookingsLineChart />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Revenue overview</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Mock daily bars</p>
          <div className="mt-4">
            <AdminRevenueBarChart />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-amber-800" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Booking requests
              </p>
              <p className="text-xs text-zinc-500">Awaiting response</p>
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-900">
            {metrics.awaitingResponse}
          </p>
          <Link
            href="/admin/bookings"
            className="mt-2 inline-block text-xs font-semibold text-amber-900 hover:underline"
          >
            View bookings →
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-800" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Active bookings
              </p>
              <p className="text-xs text-zinc-500">Pending / ongoing</p>
            </div>
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-900">
            {metrics.activeBookings}
          </p>
          <Link
            href="/admin/bookings"
            className="mt-2 inline-block text-xs font-semibold text-amber-900 hover:underline"
          >
            Manage →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-semibold text-zinc-900">
                Recent booking requests
              </h2>
              <Link
                href="/admin/bookings"
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                View all requests →
              </Link>
            </div>
            <div className="mt-2">
              {recentRequests.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">No open requests.</p>
              ) : (
                recentRequests.map((t) => (
                  <AdminBookingRequestItem
                    key={t.id}
                    clientName={t.clientName}
                    shootType={t.eventType}
                    location={t.eventLocation}
                    dateTime={`${t.eventDate}${t.eventTimeframe ? ` · ${t.eventTimeframe}` : ''} · ${t.duration}`}
                    threadId={t.id}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-semibold text-zinc-900">Top photographers</h2>
              <Link
                href="/admin/photographers"
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                Directory →
              </Link>
            </div>
            <div className="mt-4">
              <AdminTopPhotographersTable rows={topPhotogs} />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-semibold text-zinc-900">
                Recent messages (support inbox)
              </h2>
              <Link
                href="/admin/messages"
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                View all messages →
              </Link>
            </div>
            <div className="mt-2">
              {supportPreview.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No support messages yet. Users can send from Help / Contact.
                </p>
              ) : (
                supportPreview.map((m) => (
                  <AdminSupportMessageItem
                    key={m.id}
                    msg={m}
                    onMarkRead={async (id) => {
                      await markSupportInboxRead(id);
                    }}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-900">Platform activity</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Booking lifecycle & system events
            </p>
            <div className="mt-4">
              {activityEvents.length === 0 ? (
                <p className="text-sm text-zinc-500">No events yet.</p>
              ) : (
                <AdminActivityFeed events={activityEvents} />
              )}
            </div>
            <Link
              href="/admin/inbox"
              className="mt-4 inline-block text-xs font-semibold text-amber-900 hover:underline"
            >
              Open applications inbox →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
