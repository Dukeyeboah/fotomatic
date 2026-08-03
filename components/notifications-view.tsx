'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  markNotificationsRead,
  subscribeNotifications,
  type AppNotification,
} from '@/lib/firebase/booking-threads';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function formatWhen(_n: AppNotification): string {
  return 'Just now';
}

export function NotificationsView({
  threadMessagesBaseHref,
  loginRedirectTo,
}: {
  /** e.g. `/dashboard/messages` — thread id appended as `?thread=` */
  threadMessagesBaseHref: string;
  loginRedirectTo: string;
}) {
  const { user, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [marking, setMarking] = useState(false);
  const unreadIds = useMemo(
    () => items.filter((n) => !n.read && n.id).map((n) => n.id!) ?? [],
    [items],
  );

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setItems);
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-8 pt-0 sm:px-6 lg:px-10">
      <div className="sticky top-14 z-20 -mx-4 flex items-center justify-between gap-4 border-b border-zinc-200/70 bg-[#f4f1ec]/95 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-[#f4f1ec]/90 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Updates about your bookings and messages.
          </p>
        </div>
        {!loading && user && unreadIds.length > 0 ? (
          <button
            type="button"
            disabled={marking}
            onClick={async () => {
              if (unreadIds.length === 0) return;
              setMarking(true);
              await markNotificationsRead(unreadIds);
              setMarking(false);
            }}
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            {marking ? 'Marking…' : 'Mark all read'}
          </button>
        ) : null}
      </div>

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
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          No notifications yet.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {items.map((n) => (
            <div
              key={n.id ?? `${n.title}-${n.body}`}
              className={[
                'rounded-2xl border bg-white p-5 shadow-sm',
                n.read ? 'border-zinc-200' : 'border-amber-200',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {n.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{n.body}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {formatWhen(n)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
                  {n.ctaHref?.trim() ? (
                    <button
                      type="button"
                      className="rounded-full bg-amber-900 px-4 py-2 text-center text-xs font-semibold text-white hover:bg-amber-950"
                      onClick={async () => {
                        const href = n.ctaHref!.trim();
                        if (n.id && !n.read) {
                          await markNotificationsRead([n.id]);
                        }
                        router.push(href);
                      }}
                    >
                      {n.ctaLabel?.trim() || 'Open'}
                    </button>
                  ) : null}
                  {n.threadId ? (
                    <button
                      type="button"
                      className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
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
          ))}
        </div>
      )}
    </div>
  );
}
