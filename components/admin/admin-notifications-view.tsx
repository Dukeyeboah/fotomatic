'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  markNotificationsRead,
  subscribeNotifications,
  type AppNotification,
} from '@/lib/firebase/booking-threads';
import {
  markAdminEventRead,
  markAllUnreadAdminEventsRead,
  subscribeAdminEvents,
  type AdminEvent,
} from '@/lib/firebase/admin';
import { Loader2 } from 'lucide-react';

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

const BOOKING_NOTIFICATION_TYPES: AppNotification['type'][] = [
  'booking_requested',
  'booking_accepted',
  'booking_suggested',
  'booking_declined',
  'new_message',
];

function isBookingNotification(n: AppNotification): boolean {
  return BOOKING_NOTIFICATION_TYPES.includes(n.type);
}

function isApplicationAdminEvent(e: AdminEvent): boolean {
  return e.type === 'photographer_application';
}

function isBookingAdminEvent(e: AdminEvent): boolean {
  return e.type !== 'photographer_application';
}

function adminEventCategoryLabel(e: AdminEvent): string {
  switch (e.type) {
    case 'photographer_application':
      return 'Photographer application';
    case 'booking_requested':
      return 'Booking';
    case 'booking_accepted':
      return 'Booking';
    case 'booking_suggested':
      return 'Booking';
    case 'booking_declined':
      return 'Booking';
    default:
      return 'Booking';
  }
}

type MergedRow =
  | { kind: 'notification'; item: AppNotification }
  | { kind: 'admin_event'; item: AdminEvent };

export type AdminNotificationCategory = 'all' | 'applications' | 'bookings';
export type AdminNotificationReadFilter = 'all' | 'unread';

export function AdminNotificationsView({
  threadMessagesBaseHref,
  loginRedirectTo,
}: {
  threadMessagesBaseHref: string;
  loginRedirectTo: string;
}) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([]);
  const [marking, setMarking] = useState(false);
  const [category, setCategory] =
    useState<AdminNotificationCategory>('all');
  const [readFilter, setReadFilter] =
    useState<AdminNotificationReadFilter>('all');

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setNotifications);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeAdminEvents(setAdminEvents);
  }, [user]);

  const merged = useMemo(() => {
    const notifRows: MergedRow[] = notifications.map((n) => ({
      kind: 'notification' as const,
      item: n,
    }));
    const eventRows: MergedRow[] = adminEvents
      .filter((e) => e.id)
      .map((e) => ({ kind: 'admin_event' as const, item: e }));
    return [...notifRows, ...eventRows].sort(
      (a, b) =>
        firestoreMs(
          b.kind === 'notification' ? b.item.createdAt : b.item.createdAt,
        ) -
        firestoreMs(
          a.kind === 'notification' ? a.item.createdAt : a.item.createdAt,
        ),
    );
  }, [notifications, adminEvents]);

  const filtered = useMemo(() => {
    return merged.filter((row) => {
      if (readFilter === 'unread') {
        const unread =
          row.kind === 'notification' ? !row.item.read : row.item.read !== true;
        if (!unread) return false;
      }
      if (category === 'all') return true;
      if (category === 'applications') {
        return row.kind === 'admin_event' && isApplicationAdminEvent(row.item);
      }
      if (category === 'bookings') {
        if (row.kind === 'notification') {
          return isBookingNotification(row.item);
        }
        return isBookingAdminEvent(row.item);
      }
      return true;
    });
  }, [merged, category, readFilter]);

  const unreadNotificationIds = useMemo(
    () => notifications.filter((n) => !n.read && n.id).map((n) => n.id!) ?? [],
    [notifications],
  );

  const hasUnreadAdminEvents = useMemo(
    () => adminEvents.some((e) => e.read !== true && e.id),
    [adminEvents],
  );

  const hasAnyUnread =
    unreadNotificationIds.length > 0 || hasUnreadAdminEvents;

  const filterPill = (
    id: AdminNotificationCategory,
    label: string,
  ) => (
    <button
      key={id}
      type="button"
      onClick={() => setCategory(id)}
      className={[
        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        category === id
          ? 'bg-zinc-900 text-white'
          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
      ].join(' ')}
    >
      {label}
    </button>
  );

  const readPill = (id: AdminNotificationReadFilter, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setReadFilter(id)}
      className={[
        'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
        readFilter === id
          ? 'border-amber-900 bg-amber-50 text-amber-950'
          : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Your alerts, photographer applications, and booking activity in one
            place. Filter by type or unread.
          </p>
        </div>
        {!loading && user && hasAnyUnread ? (
          <button
            type="button"
            disabled={marking}
            onClick={async () => {
              setMarking(true);
              if (unreadNotificationIds.length > 0) {
                await markNotificationsRead(unreadNotificationIds);
              }
              if (hasUnreadAdminEvents) {
                await markAllUnreadAdminEventsRead();
              }
              setMarking(false);
            }}
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            {marking ? 'Marking…' : 'Mark all read'}
          </button>
        ) : null}
      </div>

      {user ? (
        <div className="mt-6 flex flex-col gap-3">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {filterPill('all', 'All')}
              {filterPill('applications', 'Applications')}
              {filterPill('bookings', 'Bookings & messages')}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Read status
            </p>
            <div className="flex flex-wrap gap-2">
              {readPill('all', 'All')}
              {readPill('unread', 'Unread only')}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      ) : !user ? (
        <p className="mt-8 text-sm text-zinc-600">
          <button
            type="button"
            onClick={() => openLoginModal({ redirectTo: loginRedirectTo })}
            className="cursor-pointer font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to view notifications.
        </p>
      ) : merged.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          No notifications yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Nothing matches these filters. Change category or read status above
          to see more.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {filtered.map((row) => {
            if (row.kind === 'notification') {
              const n = row.item;
              const booking = isBookingNotification(n);
              return (
                <div
                  key={`n-${n.id}`}
                  className={[
                    'rounded-2xl border bg-white p-5 shadow-sm',
                    n.read ? 'border-zinc-200' : 'border-amber-200',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        {booking ? 'Booking / message' : 'System'}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {n.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">{n.body}</p>
                    </div>
                    {n.threadId ? (
                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                        onClick={async () => {
                          if (n.id && !n.read) {
                            await markNotificationsRead([n.id]);
                          }
                          router.push(
                            `${threadMessagesBaseHref}?thread=${encodeURIComponent(n.threadId!)}`,
                          );
                        }}
                      >
                        View
                      </button>
                    ) : null}
                  </div>
                  {!n.read && n.id ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                        onClick={async () => {
                          await markNotificationsRead([n.id!]);
                        }}
                      >
                        Mark read
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            }
            const e = row.item;
            const isApp = isApplicationAdminEvent(e);
            const unread = e.read !== true;
            if (isApp) {
              return (
                <div
                  key={`e-${e.id}`}
                  className={[
                    'rounded-2xl border p-5 shadow-sm',
                    unread
                      ? 'border-violet-200 bg-violet-50/40'
                      : 'border-zinc-200 bg-white',
                  ].join(' ')}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-800">
                    {adminEventCategoryLabel(e)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {e.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{e.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {e.applicationId ? (
                      <button
                        type="button"
                        className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                        onClick={async () => {
                          if (e.id) await markAdminEventRead(e.id);
                          router.push(
                            `/admin/applications/${encodeURIComponent(e.applicationId!)}`,
                          );
                        }}
                      >
                        Review application
                      </button>
                    ) : null}
                    {e.id && unread ? (
                      <button
                        type="button"
                        className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                        onClick={() => void markAdminEventRead(e.id!)}
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={`e-${e.id}`}
                className={[
                  'rounded-2xl border p-5 shadow-sm',
                  unread
                    ? 'border-sky-200 bg-sky-50/40'
                    : 'border-zinc-200 bg-white',
                ].join(' ')}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
                  {adminEventCategoryLabel(e)}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {e.title}
                </p>
                <p className="mt-1 text-sm text-zinc-600">{e.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {e.threadId ? (
                    <button
                      type="button"
                      className="inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                      onClick={async () => {
                        if (e.id) await markAdminEventRead(e.id);
                        router.push(
                          `${threadMessagesBaseHref}?thread=${encodeURIComponent(e.threadId!)}`,
                        );
                      }}
                    >
                      View thread
                    </button>
                  ) : null}
                  {e.id && unread ? (
                    <button
                      type="button"
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                      onClick={() => void markAdminEventRead(e.id!)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
