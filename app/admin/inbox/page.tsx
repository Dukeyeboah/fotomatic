'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  adminMarkInboxSeen,
  subscribeAdminInboxCounts,
} from '@/lib/firebase/admin-inbox';
import {
  subscribeRecentApplications,
  type PhotographerApplication,
} from '@/lib/firebase/admin';
import {
  adminApprovePhotographerApplication,
  adminDeclinePhotographerApplication,
} from '@/lib/firebase/admin-actions';

function millis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (
    typeof v === 'object' &&
    v !== null &&
    'toMillis' in v &&
    typeof (v as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function statusBadge(status: PhotographerApplication['status']): {
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
    label: 'Submitted',
    className: 'bg-amber-50 text-amber-950 ring-amber-200',
  };
}

export default function AdminInboxPage() {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [apps, setApps] = useState<PhotographerApplication[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) return;
    return subscribeRecentApplications(setApps);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    return subscribeAdminInboxCounts(user.uid, () => {});
  }, [user, isAdmin]);

  const sorted = useMemo(
    () =>
      [...apps].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
    [apps],
  );

  const pendingCount = useMemo(
    () => sorted.filter((a) => a.status === 'submitted').length,
    [sorted],
  );

  async function decide(
    app: PhotographerApplication,
    action: 'approve' | 'decline',
  ) {
    if (!app.id) return;
    const ok = confirm(
      action === 'approve'
        ? `Approve ${app.name} as a photographer?`
        : `Decline ${app.name}'s application?`,
    );
    if (!ok) return;
    setBusyId(app.id);
    const res =
      action === 'approve'
        ? await adminApprovePhotographerApplication({
            applicationId: app.id,
            applicantUserId: app.applicantUserId,
            applicantName: app.name,
          })
        : await adminDeclinePhotographerApplication({
            applicationId: app.id,
            applicantUserId: app.applicantUserId,
            applicantName: app.name,
          });
    setBusyId(null);
    if (!res.ok) alert(res.message);
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Applications
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Photographer applications. Expand a card for details. Booking
            threads live under Bookings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && user ? (
            <button
              type="button"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              onClick={() => void adminMarkInboxSeen(user.uid, 'applications')}
            >
              Mark applications seen
            </button>
          ) : null}
          <Link
            href="/admin/bookings"
            className="text-sm font-semibold text-amber-900 underline"
          >
            Bookings
          </Link>
        </div>
      </div>

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
          to view applications.
        </p>
      ) : !isAdmin ? (
        <div className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950">
          Not authorized.
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {sorted.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600">
              No applications yet.
            </p>
          ) : (
            sorted.map((a) => {
              const open = expandedId === a.id;
              const badge = statusBadge(a.status);
              const price =
                typeof a.startingPrice === 'number'
                  ? a.startingPrice
                  : a.startingHourlyRate;
              return (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(open ? null : a.id ?? null)
                    }
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                  >
                    {open ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-900">
                        {a.name}
                      </p>
                      <p className="truncate text-xs text-zinc-600">
                        {[a.city, a.country].filter(Boolean).join(', ')}
                        {a.email ? ` · ${a.email}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </button>

                  {open ? (
                    <div className="space-y-4 border-t border-zinc-100 px-4 pb-6 pt-4 text-sm text-zinc-700">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold text-zinc-900">
                            Focus:{' '}
                          </span>
                          {(a.photographyFocuses ?? []).join(', ') ||
                            a.photographyFocus ||
                            '—'}
                        </p>
                        <p>
                          <span className="font-semibold text-zinc-900">
                            Starting price:{' '}
                          </span>
                          {typeof price === 'number'
                            ? `$${price.toLocaleString()}`
                            : '—'}
                        </p>
                        <p>
                          <span className="font-semibold text-zinc-900">
                            Service area:{' '}
                          </span>
                          {a.serviceArea || '—'}
                        </p>
                        <p>
                          <span className="font-semibold text-zinc-900">
                            Phone:{' '}
                          </span>
                          {a.phone || '—'}
                        </p>
                      </div>
                      {a.bio ? (
                        <p className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-800">
                          {a.bio}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/applications/${encodeURIComponent(a.id ?? '')}`}
                          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                        >
                          Full application
                        </Link>
                        {a.status === 'submitted' ? (
                          <>
                            <button
                              type="button"
                              disabled={busyId === a.id}
                              className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                              onClick={() => void decide(a, 'approve')}
                            >
                              {busyId === a.id ? '…' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === a.id}
                              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
                              onClick={() => void decide(a, 'decline')}
                            >
                              Decline
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
