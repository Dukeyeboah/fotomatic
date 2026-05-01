'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  adminMarkInboxSeen,
  subscribeAdminInboxCounts,
  type AdminInboxCounts,
} from '@/lib/firebase/admin-inbox';
import {
  subscribeAdminEvents,
  subscribeRecentApplications,
  type AdminEvent,
  type PhotographerApplication,
} from '@/lib/firebase/admin';
import { Loader2 } from 'lucide-react';

function millis(v: any): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  return 0;
}

export default function AdminInboxPage() {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [counts, setCounts] = useState<AdminInboxCounts>({
    newApplications: 0,
    newEvents: 0,
    total: 0,
  });
  const [apps, setApps] = useState<PhotographerApplication[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) return;
    return subscribeAdminInboxCounts(user.uid, setCounts);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const u1 = subscribeRecentApplications(setApps);
    const u2 = subscribeAdminEvents(setEvents);
    return () => {
      u1();
      u2();
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
  }, [user, isAdmin]);

  const submitted = useMemo(
    () => apps.filter((a) => a.status === 'submitted').sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
    [apps],
  );

  const bookingEvents = useMemo(
    () => events.filter((e) => e.type !== 'photographer_application'),
    [events],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          ADMIN
        </p>
        <h1 className="mt-2 font-serif text-2xl font-medium text-zinc-900">
          Inbox
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          New photographer applications and booking lifecycle events.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : !user ? (
          <p className="mt-8 text-sm text-zinc-600">
            <button
              type="button"
              onClick={() => openLoginModal({ redirectTo: '/admin/inbox' })}
              className="cursor-pointer font-medium text-amber-900 underline"
            >
              Log in
            </button>{' '}
            to view admin inbox.
          </p>
        ) : !isAdmin ? (
          <div className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950">
            Not authorized.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    New applications
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {counts.newApplications} unread
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="text-xs font-semibold text-amber-900 underline"
                >
                  Back to dashboard
                </Link>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                  onClick={() => user && adminMarkInboxSeen(user.uid, 'applications')}
                >
                  Mark applications seen
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {submitted.length === 0 ? (
                  <p className="text-sm text-zinc-600">No new applications.</p>
                ) : (
                  submitted.slice(0, 20).map((a) => (
                    <Link
                      key={a.id}
                      href={`/admin/applications/${encodeURIComponent(a.id ?? '')}`}
                      className="block rounded-xl border border-zinc-200 p-4 text-sm hover:bg-zinc-50"
                    >
                      <p className="font-semibold text-zinc-900">{a.name}</p>
                      <p className="mt-1 text-zinc-600">
                        {a.city}, {a.country}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{a.email}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Booking events
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {counts.newEvents} unread
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                  onClick={() => user && adminMarkInboxSeen(user.uid, 'events')}
                >
                  Mark events seen
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {bookingEvents.length === 0 ? (
                  <p className="text-sm text-zinc-600">No events yet.</p>
                ) : (
                  bookingEvents.slice(0, 30).map((e) => (
                    <div
                      key={e.id}
                      className="rounded-xl border border-zinc-200 p-4 text-sm"
                    >
                      <p className="font-semibold text-zinc-900">{e.title}</p>
                      <p className="mt-1 text-zinc-600">{e.body}</p>
                      {e.threadId ? (
                        <p className="mt-2 text-xs">
                          <Link
                            className="font-semibold text-amber-900 underline"
                            href={`/messages?thread=${encodeURIComponent(e.threadId)}`}
                          >
                            View thread
                          </Link>
                        </p>
                      ) : null}
                      {e.applicationId ? (
                        <p className="mt-2 text-xs">
                          <Link
                            className="font-semibold text-amber-900 underline"
                            href={`/admin/applications/${encodeURIComponent(e.applicationId)}`}
                          >
                            View application
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

