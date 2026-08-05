'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  subscribeAdminEvents,
  subscribeRecentThreads,
  subscribeAllUsersForAdmin,
  subscribeRecentApplications,
  type AdminEvent,
  type PhotographerApplication,
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
import { AdminBookingRequestItem } from '@/components/admin/admin-booking-request-item';
import { AdminSupportMessageItem } from '@/components/admin/admin-support-message-item';
import { AdminActivityFeed } from '@/components/admin/admin-activity-feed';
import { AdminTopPhotographersTable } from '@/components/admin/admin-top-photographers-table';
import {
  ADMIN_RANGE_OPTIONS,
  firestoreTimeMs,
  useAdminDateRange,
  type AdminRangeId,
} from '@/contexts/AdminDateRangeContext';
import {
  CalendarCheck,
  DollarSign,
  Users,
  Camera,
  Inbox,
  Activity,
  FileText,
} from 'lucide-react';
import { bookingStatusBadge } from '@/lib/booking-status-display';

type AdminHomeTab =
  // | 'bookings_overview'
  // | 'revenue_overview'
  | 'booking_requests'
  // | 'active_bookings'
  // | 'recent_booking_requests'
  | 'messages'
  | 'applications'
  | 'platform_activity'
  | 'top_photographers';

type HistoryRange = '1m' | '6m' | '1y';

const HISTORY_MS: Record<HistoryRange, number> = {
  '1m': 30 * 24 * 60 * 60 * 1000,
  '6m': 182 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
};

/** Fixed panel body height + vertical scroll for dashboard list cards. */
const PANEL_BODY = 'mt-3 h-[280px] overflow-y-auto';
const PANEL_BODY_TIGHT = 'mt-2 h-[280px] overflow-y-auto';

function threadMs(t: BookingThread): number {
  return firestoreTimeMs(t.updatedAt ?? t.createdAt);
}

function appMs(a: PhotographerApplication): number {
  return firestoreTimeMs(a.createdAt);
}

function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-amber-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function applicationStatusBadge(status: PhotographerApplication['status']): {
  label: string;
  className: string;
} {
  if (status === 'approved') {
    return {
      label: 'Approved',
      className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    };
  }
  if (status === 'declined') {
    return {
      label: 'Declined',
      className: 'bg-red-50 text-red-900 ring-red-200',
    };
  }
  return {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-950 ring-amber-200',
  };
}

export function AdminDashboardHome() {
  const { range, setRange, rangeDays, rangeStartMs } = useAdminDateRange();
  const [homeTab, setHomeTab] = useState<AdminHomeTab>('booking_requests');
  const [historyRange, setHistoryRange] = useState<HistoryRange>('1m');
  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [directory, setDirectory] = useState<Photographer[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [support, setSupport] = useState<SupportInboxMessage[]>([]);
  const [applications, setApplications] = useState<PhotographerApplication[]>(
    [],
  );

  useEffect(() => {
    const u1 = subscribeRecentThreads(setThreads);
    const u2 = subscribeAllUsersForAdmin(setUsers);
    const u3 = subscribePhotographersDirectory(setDirectory);
    const u4 = subscribeAdminEvents(setEvents);
    const u5 = subscribeSupportInboxForAdmin(setSupport);
    const u6 = subscribeRecentApplications(setApplications);
    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
    };
  }, []);

  const rangeThreads = useMemo(
    () => threads.filter((t) => threadMs(t) >= rangeStartMs),
    [threads, rangeStartMs],
  );

  const metrics = useMemo(
    () =>
      computeAdminDashboardMetrics(
        threads,
        users,
        directory.length,
        rangeDays,
      ),
    [threads, users, directory.length, rangeDays],
  );

  const topPhotogs = useMemo(
    () => computeTopPhotographers(rangeThreads, 40),
    [rangeThreads],
  );

  const awaitingRequests = useMemo(
    () => threads.filter((t) => t.status === 'requested'),
    [threads],
  );

  const openRequests = useMemo(() => {
    return [...awaitingRequests].sort((a, b) => threadMs(b) - threadMs(a));
  }, [awaitingRequests]);

  const activeThreads = useMemo(
    () =>
      threads.filter(
        (t) =>
          t.status === 'accepted_pending_payment' ||
          t.status === 'confirmed' ||
          t.status === 'pending_client_response',
      ),
    [threads],
  );

  const historyThreads = useMemo(() => {
    const cutoff = Date.now() - HISTORY_MS[historyRange];
    return [...threads]
      .filter((t) => threadMs(t) >= cutoff)
      .sort((a, b) => threadMs(b) - threadMs(a));
  }, [threads, historyRange]);

  const activityEvents = useMemo(
    () =>
      events
        .filter((e) => e.type !== 'photographer_application')
        .filter((e) => firestoreTimeMs(e.createdAt) >= rangeStartMs),
    [events, rangeStartMs],
  );

  const supportInRange = useMemo(
    () => support.filter((m) => firestoreTimeMs(m.createdAt) >= rangeStartMs),
    [support, rangeStartMs],
  );

  const unreadMessages = useMemo(
    () => support.filter((m) => !m.readByAdmin).length,
    [support],
  );

  const pendingApplications = useMemo(
    () =>
      applications
        .filter((a) => a.status === 'submitted')
        .sort((a, b) => appMs(b) - appMs(a)),
    [applications],
  );

  const applicationHistory = useMemo(() => {
    const cutoff = Date.now() - HISTORY_MS[historyRange];
    return applications
      .filter((a) => a.status !== 'submitted')
      .filter((a) => appMs(a) >= cutoff || appMs(a) === 0)
      .sort((a, b) => appMs(b) - appMs(a));
  }, [applications, historyRange]);

  const tabs: ReadonlyArray<{
    id: AdminHomeTab;
    label: string;
    badge?: number;
  }> = [
    // { id: 'bookings_overview', label: 'Bookings overview' },
    // { id: 'revenue_overview', label: 'Revenue overview' },
    {
      id: 'booking_requests',
      label: 'Booking requests',
      badge: awaitingRequests.length,
    },
    // { id: 'active_bookings', label: 'Active bookings' },
    // { id: 'recent_booking_requests', label: 'Recent booking requests' },
    { id: 'messages', label: 'Messages', badge: unreadMessages },
    {
      id: 'applications',
      label: 'Applications',
      badge: pendingApplications.length,
    },
    { id: 'platform_activity', label: 'Platform activity' },
    { id: 'top_photographers', label: 'Top photographers' },
  ];

  const rangeLabel =
    rangeDays === 7
      ? 'this week'
      : rangeDays === 30
        ? 'last 30 days'
        : 'last 90 days';

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-4 flex justify-end">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as AdminRangeId)}
          aria-label="Date range"
          className="rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-zinc-700 outline-none hover:border-zinc-300 hover:text-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        >
          {ADMIN_RANGE_OPTIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={`Bookings (${rangeLabel})`}
          value={metrics.totalBookings}
          deltaPct={metrics.totalBookingsDeltaPct}
          icon={CalendarCheck}
          tintClass="bg-sky-50/90"
        />
        <AdminStatCard
          label={`Revenue (${rangeLabel})`}
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
          label={`New users (${rangeLabel})`}
          value={metrics.newUsersThisWeek}
          deltaPct={metrics.newUsersDeltaPct}
          icon={Users}
          tintClass="bg-amber-50/90"
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-1 border-b border-zinc-200/90">
        {tabs.map((tab) => {
          const active = homeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHomeTab(tab.id)}
              className={`relative -mb-px flex cursor-pointer items-center px-2.5 py-2.5 text-sm transition-colors sm:px-3.5 ${
                active
                  ? 'font-medium text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
              <TabBadge count={tab.badge ?? 0} />
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-900" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {homeTab === 'booking_requests' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex shrink-0 items-center gap-2">
                  <Inbox className="h-5 w-5 text-amber-800" strokeWidth={1.75} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Booking requests
                    </p>
                    <p className="text-xs text-zinc-500">
                      Awaiting response · not yet attended
                    </p>
                  </div>
                </div>
                <p className="mt-3 shrink-0 text-3xl font-semibold tabular-nums text-zinc-900">
                  {awaitingRequests.length}
                </p>
                <Link
                  href="/admin/bookings"
                  className="mt-2 inline-block shrink-0 text-xs font-semibold text-amber-900 hover:underline"
                >
                  View bookings →
                </Link>
                <div className={`${PANEL_BODY} min-h-0 flex-1`}>
                  {openRequests.length === 0 ? (
                    <p className="text-xs text-zinc-500">No open requests.</p>
                  ) : (
                    openRequests.map((t) => (
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
              </div>

              <div className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex shrink-0 items-center gap-2">
                  <Activity
                    className="h-5 w-5 text-emerald-800"
                    strokeWidth={1.75}
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Active bookings
                    </p>
                    <p className="text-xs text-zinc-500">Pending / ongoing</p>
                  </div>
                </div>
                <p className="mt-3 shrink-0 text-3xl font-semibold tabular-nums text-zinc-900">
                  {metrics.activeBookings}
                </p>
                <div className={`${PANEL_BODY} min-h-0 flex-1 space-y-1`}>
                  {activeThreads.length === 0 ? (
                    <p className="text-xs text-zinc-500">No active bookings.</p>
                  ) : (
                    activeThreads.map((t) => {
                      const b = bookingStatusBadge(t.status);
                      return (
                        <Link
                          key={t.id}
                          href={`/admin/bookings?thread=${encodeURIComponent(t.id!)}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-zinc-50"
                        >
                          <span className="min-w-0 truncate text-zinc-800">
                            {t.clientName} → {t.photographerName}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${b.className}`}
                          >
                            {b.label}
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <section className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-zinc-900">
                    Booking history
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    All threads in the selected window
                  </p>
                </div>
                <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                  {(
                    [
                      { id: '1m', label: '1 month' },
                      { id: '6m', label: '6 months' },
                      { id: '1y', label: '1 year' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHistoryRange(opt.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        historyRange === opt.id
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={`${PANEL_BODY} min-h-0 flex-1 divide-y divide-zinc-100`}
              >
                {historyThreads.length === 0 ? (
                  <p className="py-6 text-sm text-zinc-500">
                    No bookings in this period.
                  </p>
                ) : (
                  historyThreads.map((t) => {
                    const b = bookingStatusBadge(t.status);
                    return (
                      <Link
                        key={t.id}
                        href={`/admin/bookings?thread=${encodeURIComponent(t.id!)}`}
                        className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-zinc-50/80"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-zinc-900">
                            {t.clientName} → {t.photographerName}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {t.eventType} · {t.eventDate}
                            {typeof t.acceptedTotalPrice === 'number'
                              ? ` · $${t.acceptedTotalPrice.toLocaleString()}`
                              : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${b.className}`}
                        >
                          {b.label}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        ) : null}

        {homeTab === 'messages' ? (
          <section className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex shrink-0 items-end justify-between gap-3">
              <h2 className="font-semibold text-zinc-900">Messages</h2>
              <Link
                href="/admin/messages"
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                Open inbox →
              </Link>
            </div>
            <div className={`${PANEL_BODY_TIGHT} min-h-0 flex-1`}>
              {supportInRange.length === 0 ? (
                <p className="py-6 text-sm text-zinc-500">
                  No support messages in the selected range.
                </p>
              ) : (
                supportInRange.map((m) => (
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
        ) : null}

        {homeTab === 'applications' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex shrink-0 items-center gap-2">
                  <FileText
                    className="h-5 w-5 text-amber-800"
                    strokeWidth={1.75}
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Pending applications
                    </p>
                    <p className="text-xs text-zinc-500">Awaiting review</p>
                  </div>
                </div>
                <p className="mt-3 shrink-0 text-3xl font-semibold tabular-nums text-zinc-900">
                  {pendingApplications.length}
                </p>
                <Link
                  href="/admin/inbox"
                  className="mt-2 inline-block shrink-0 text-xs font-semibold text-amber-900 hover:underline"
                >
                  Open applications →
                </Link>
                <div className={`${PANEL_BODY} min-h-0 flex-1 space-y-1`}>
                  {pendingApplications.length === 0 ? (
                    <p className="text-xs text-zinc-500">No pending applications.</p>
                  ) : (
                    pendingApplications.map((a) => {
                      const badge = applicationStatusBadge(a.status);
                      return (
                        <Link
                          key={a.id}
                          href={`/admin/applications/${encodeURIComponent(a.id ?? '')}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">
                              {a.name}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {[a.city, a.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-900">
                      Application history
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Approved & declined
                    </p>
                  </div>
                  <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                    {(
                      [
                        { id: '1m', label: '1 month' },
                        { id: '6m', label: '6 months' },
                        { id: '1y', label: '1 year' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setHistoryRange(opt.id)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          historyRange === opt.id
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`${PANEL_BODY} min-h-0 flex-1 space-y-1`}>
                  {applicationHistory.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No decided applications in this period.
                    </p>
                  ) : (
                    applicationHistory.map((a) => {
                      const badge = applicationStatusBadge(a.status);
                      return (
                        <Link
                          key={a.id}
                          href={`/admin/applications/${encodeURIComponent(a.id ?? '')}`}
                          className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-zinc-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900">
                              {a.name}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {[a.city, a.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {homeTab === 'platform_activity' ? (
          <section className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex shrink-0 items-end justify-between gap-3">
              <div>
                <h2 className="font-semibold text-zinc-900">
                  Platform activity
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Booking lifecycle & system events in the selected range
                </p>
              </div>
              <Link
                href="/admin/inbox"
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                Open applications →
              </Link>
            </div>
            <div className={`${PANEL_BODY} min-h-0 flex-1`}>
              {activityEvents.length === 0 ? (
                <p className="text-sm text-zinc-500">No events in this range.</p>
              ) : (
                <AdminActivityFeed events={activityEvents} />
              )}
            </div>
          </section>
        ) : null}

        {homeTab === 'top_photographers' ? (
          <section className="flex h-[360px] flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex shrink-0 items-end justify-between gap-3">
              <div>
                <h2 className="font-semibold text-zinc-900">
                  Top photographers
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Based on bookings in the selected range — click a row to open
                  their profile
                </p>
              </div>
              <Link
                href="/admin/photographers"
                className="text-xs font-semibold text-amber-900 hover:underline"
              >
                Directory →
              </Link>
            </div>
            <div className={`${PANEL_BODY} min-h-0 flex-1`}>
              <AdminTopPhotographersTable rows={topPhotogs} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
