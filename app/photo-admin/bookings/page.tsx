'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  claimDirectoryIdForPhotographer,
  photographerAccept,
  photographerDecline,
  photographerSuggestAlternative,
  subscribeMessagesForThread,
  subscribeThreadsForPhotographer,
  type BookingThread,
  type BookingThreadMessage,
} from '@/lib/firebase/booking-threads';
import { Loader2 } from 'lucide-react';

function statusLabel(s: BookingThread['status']): string {
  switch (s) {
    case 'requested':
      return 'Requested';
    case 'accepted_pending_payment':
      return 'Accepted – Pending payment';
    case 'confirmed':
      return 'Confirmed';
    case 'pending_client_response':
      return 'Pending client response';
    case 'declined':
      return 'Declined';
    case 'expired':
      return 'Expired';
    default:
      return s;
  }
}

function durationToHoursApprox(duration: string): number {
  const t = duration.toLowerCase();
  const m = /(\d+(?:\.\d+)?)\s*hour/.exec(t);
  if (m) return Math.max(0.25, Number(m[1]));
  if (t.includes('half day')) return 4;
  if (t.includes('full day')) return 8;
  return 1;
}

export default function PhotoAdminBookingsPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { openLoginModal } = useLoginModal();

  const directoryId = userData?.photographer?.directoryId ?? '';

  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BookingThreadMessage[]>([]);

  const [acceptRate, setAcceptRate] = useState<number | ''>('');
  const [declineReason, setDeclineReason] = useState('');
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTimeframe, setSuggestTimeframe] = useState('');
  const [suggestMessage, setSuggestMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  useEffect(() => {
    if (loading || user) return;
    openLoginModal({ redirectTo: '/photo-admin/bookings' });
  }, [loading, user, openLoginModal]);

  useEffect(() => {
    if (!user) return;
    if (!directoryId) {
      setThreads([]);
      return;
    }
    return subscribeThreadsForPhotographer({
      photographerUserId: user.uid,
      directoryId,
      cb: (t) => {
        setThreads(t);
        if (!activeThreadId && t[0]?.id) setActiveThreadId(t[0].id);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, directoryId]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    return subscribeMessagesForThread(activeThreadId, setMessages);
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThread) return;
    // Initialize suggested acceptance rate from profile or request.
    const fromProfile =
      typeof userData?.photographer?.hourlyRate === 'number'
        ? userData.photographer.hourlyRate
        : null;
    const fromRequest = activeThread.photographerStartingHourlyRate;
    setAcceptRate(fromProfile ?? fromRequest ?? '');
    setDeclineReason('');
    setSuggestDate('');
    setSuggestTimeframe('');
    setSuggestMessage('');
  }, [activeThread?.id, userData?.photographer?.hourlyRate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-zinc-600">
          Sign in to view photographer bookings.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          PHOTO ADMIN
        </p>
        <h1 className="mt-2 font-serif text-2xl font-medium text-zinc-900">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review requests and respond with Accept, Suggest alternative, or Decline.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="/photo-admin/setup" className="underline">
            Edit your profile
          </Link>
        </p>

        {userData?.role !== 'photographer' ? (
          <div className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950">
            Your account is not marked as a photographer yet. Visit{' '}
            <Link className="underline" href="/photo-admin/setup">
              /photo-admin/setup
            </Link>{' '}
            first.
          </div>
        ) : !directoryId ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
            <p className="font-semibold text-zinc-900">
              Set your directory id to receive requests
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              In your photographer profile, set a directory id like{' '}
              <code className="rounded bg-zinc-100 px-1">dir-12</code>. This links
              your account to the public directory card.
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
              onClick={() => (window.location.href = '/photo-admin/setup')}
            >
              Go to setup
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Requests ({directoryId})
              </p>
              {threads.length === 0 ? (
                <div className="px-2 py-6 text-sm text-zinc-600">
                  No requests yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {threads.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveThreadId(t.id ?? null)}
                      className={[
                        'w-full rounded-xl px-3 py-3 text-left text-sm transition-colors',
                        t.id === activeThreadId
                          ? 'bg-amber-50 text-zinc-900'
                          : 'hover:bg-zinc-50 text-zinc-800',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {t.clientName || 'Client'}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-600">
                            {t.eventType} · {t.eventDate}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                          {statusLabel(t.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              {!activeThread ? (
                <div className="text-sm text-zinc-600">
                  Select a request to view details.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {activeThread.clientName || 'Client'}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {activeThread.eventType} · {activeThread.eventDate}
                        {activeThread.eventTimeframe
                          ? ` · ${activeThread.eventTimeframe}`
                          : ''}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {activeThread.duration} · {activeThread.eventLocation}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        Pricing shown to client: From $
                        {activeThread.photographerStartingHourlyRate}/hr
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white">
                      {statusLabel(activeThread.status)}
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Thread
                    </p>
                    <div className="mt-3 space-y-2">
                      {messages.map((m) => (
                        <div
                          key={m.id ?? `${m.senderUserId}-${m.text}`}
                          className={[
                            'rounded-2xl px-4 py-3 text-sm',
                            m.senderRole === 'system'
                              ? 'bg-amber-50 text-amber-950'
                              : 'bg-zinc-100 text-zinc-900',
                          ].join(' ')}
                        >
                          {m.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">
                        Accept
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Confirm final price (hourly × duration).
                      </p>
                      <label className="mt-3 block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Hourly rate ($/hr)
                        </span>
                        <input
                          inputMode="numeric"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                          value={acceptRate}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            if (!v) setAcceptRate('');
                            else setAcceptRate(Number(v));
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={saving || typeof acceptRate !== 'number'}
                        className="mt-3 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                        onClick={async () => {
                          if (!activeThread.id || typeof acceptRate !== 'number')
                            return;
                          setSaving(true);
                          const hrs = durationToHoursApprox(activeThread.duration);
                          const total = Math.round(acceptRate * hrs);
                          const res = await photographerAccept({
                            threadId: activeThread.id,
                            photographerUserId: user.uid,
                            acceptedHourlyRate: acceptRate,
                            acceptedTotalPrice: total,
                            clientUserId: activeThread.clientUserId,
                            photographerName: activeThread.photographerName,
                          });
                          setSaving(false);
                          if (!res.ok) alert(res.message);
                        }}
                      >
                        {saving ? 'Saving…' : 'Accept booking'}
                      </button>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">
                        Suggest alternative
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Propose a new date/time.
                      </p>
                      <label className="mt-3 block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Suggested date
                        </span>
                        <input
                          type="date"
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                          value={suggestDate}
                          onChange={(e) => setSuggestDate(e.target.value)}
                        />
                      </label>
                      <label className="mt-3 block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Timeframe (optional)
                        </span>
                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                          value={suggestTimeframe}
                          onChange={(e) => setSuggestTimeframe(e.target.value)}
                          placeholder="e.g. 10am"
                        />
                      </label>
                      <label className="mt-3 block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Message (optional)
                        </span>
                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                          value={suggestMessage}
                          onChange={(e) => setSuggestMessage(e.target.value)}
                          placeholder="Short note"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={saving || !suggestDate}
                        className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                        onClick={async () => {
                          if (!activeThread.id || !suggestDate) return;
                          setSaving(true);
                          const res = await photographerSuggestAlternative({
                            threadId: activeThread.id,
                            photographerUserId: user.uid,
                            clientUserId: activeThread.clientUserId,
                            photographerName: activeThread.photographerName,
                            suggestedDate: suggestDate,
                            suggestedTimeframe: suggestTimeframe,
                            message: suggestMessage,
                          });
                          setSaving(false);
                          if (!res.ok) alert(res.message);
                        }}
                      >
                        {saving ? 'Saving…' : 'Send suggestion'}
                      </button>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <p className="text-sm font-semibold text-zinc-900">
                        Decline
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Mark as unavailable (optionally add a reason).
                      </p>
                      <label className="mt-3 block space-y-1">
                        <span className="text-xs font-medium text-zinc-600">
                          Reason (optional)
                        </span>
                        <input
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={saving}
                        className="mt-3 w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                        onClick={async () => {
                          if (!activeThread.id) return;
                          setSaving(true);
                          const res = await photographerDecline({
                            threadId: activeThread.id,
                            photographerUserId: user.uid,
                            clientUserId: activeThread.clientUserId,
                            photographerName: activeThread.photographerName,
                            reason: declineReason,
                          });
                          setSaving(false);
                          if (!res.ok) alert(res.message);
                        }}
                      >
                        {saving ? 'Saving…' : 'Decline request'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                    <p className="font-semibold text-zinc-900">
                      Tip: claim your directory id
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      If you just set your directory id, you can claim older requests
                      so they attach to your photographer user.
                    </p>
                    <button
                      type="button"
                      disabled={saving}
                      className="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                      onClick={async () => {
                        if (!directoryId) return;
                        setSaving(true);
                        await claimDirectoryIdForPhotographer({
                          photographerUserId: user.uid,
                          directoryId,
                        });
                        await refreshUserData();
                        setSaving(false);
                      }}
                    >
                      Claim older requests
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

