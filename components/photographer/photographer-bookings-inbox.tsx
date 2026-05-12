'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import {
  photographerAccept,
  photographerDecline,
  photographerSuggestAlternative,
  sendThreadMessage,
  subscribeMessagesForThread,
  type BookingThread,
  type BookingThreadMessage,
} from '@/lib/firebase/booking-threads';
import {
  clientBookingAvatarUrl,
  effectivePhotographerDirectoryId,
} from '@/lib/photographer-booking-dashboard';

const FIELD =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

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

export function PhotographerBookingsInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const { threads, loading: threadsLoading } =
    usePhotographerBookingThreads();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<BookingThreadMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [acceptRate, setAcceptRate] = useState<number | ''>('');
  const [declineReason, setDeclineReason] = useState('');
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTimeframe, setSuggestTimeframe] = useState('');
  const [suggestMessage, setSuggestMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === expandedId) ?? null,
    [threads, expandedId],
  );

  const profileDirectoryId = user
    ? effectivePhotographerDirectoryId(
        user.uid,
        userData?.photographer?.directoryId,
      )
    : '';

  const setExpanded = useCallback(
    (id: string | null) => {
      setExpandedId(id);
      if (id) {
        router.replace(
          `/photographer/bookings?thread=${encodeURIComponent(id)}`,
          { scroll: false },
        );
      } else {
        router.replace('/photographer/bookings', { scroll: false });
      }
    },
    [router],
  );

  useEffect(() => {
    if (threadsLoading || threads.length === 0) return;
    if (threadParam && threads.some((t) => t.id === threadParam)) {
      setExpandedId(threadParam);
    }
  }, [threadsLoading, threads, threadParam]);

  useEffect(() => {
    if (!expandedId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    const unsub = subscribeMessagesForThread(expandedId, (m) => {
      setMessages(m);
      setMessagesLoading(false);
    });
    return () => unsub();
  }, [expandedId]);

  useEffect(() => {
    if (!activeThread) return;
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
    setReplyText('');
    setBanner(null);
  }, [
    activeThread?.id,
    userData?.photographer?.hourlyRate,
    activeThread?.status,
  ]);

  if (authLoading || !user || !userData) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (userData.role !== 'photographer') {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950">
        This inbox is for photographer accounts.
      </div>
    );
  }

  if (!profileDirectoryId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm">
        <p className="font-semibold text-zinc-900">Set up your directory listing</p>
        <p className="mt-1 text-sm text-zinc-600">
          Complete your photographer profile so bookings can match your account.
        </p>
        <Link
          href="/photographer/settings"
          className="mt-4 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Account settings
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Bookings inbox
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Review each request, reply in the thread, then accept, suggest an
        alternative, or decline.
      </p>

      {banner ? (
        <div
          className={[
            'mt-6 rounded-xl px-4 py-3 text-sm',
            banner.kind === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-950'
              : 'border border-red-200 bg-red-50 text-red-950',
          ].join(' ')}
        >
          {banner.text}
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {threadsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : threads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-600">
            No booking threads yet.
          </p>
        ) : (
          threads.map((t) => {
            const open = expandedId === t.id;
            const photo = clientBookingAvatarUrl(t);
            const actionsLocked = t.status !== 'requested';
            return (
              <div
                key={t.id}
                className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : t.id ?? null)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  {open ? (
                    <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
                  )}
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-900/5">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound
                          className="h-5 w-5 text-zinc-400"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-900">
                      {t.clientName || 'Client'}
                    </p>
                    <p className="truncate text-xs text-zinc-600">
                      {t.eventType} · {t.eventDate}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {statusLabel(t.status)}
                  </span>
                </button>

                {open && t.id ? (
                  <div className="space-y-6 border-t border-zinc-100 px-4 pb-6 pt-4">
                    {actionsLocked ? (
                      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                        Accept, suggest alternative, and decline are only
                        available while this booking is{' '}
                        <strong>Requested</strong>. You can still message the
                        client in this thread.
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {t.clientName}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {t.eventType} · {t.eventDate}
                          {t.eventTimeframe ? ` · ${t.eventTimeframe}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {t.duration} · {t.eventLocation}
                        </p>
                        <p className="mt-2 text-xs text-zinc-500">
                          Shown to client: From ${t.photographerStartingHourlyRate}/hr
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Thread
                      </p>
                      <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-zinc-50 p-3">
                        {messagesLoading ? (
                          <p className="text-center text-sm text-zinc-500">
                            Loading messages…
                          </p>
                        ) : messages.length === 0 ? (
                          <p className="text-center text-sm text-zinc-500">
                            No messages yet.
                          </p>
                        ) : (
                          messages.map((m) => (
                            <div
                              key={m.id ?? `${m.createdAt}-${m.text}`}
                              className={[
                                'rounded-xl px-3 py-2 text-sm',
                                m.senderRole === 'system'
                                  ? 'bg-amber-50 text-amber-950'
                                  : m.senderRole === 'photographer'
                                    ? 'ml-6 bg-emerald-50 text-emerald-950'
                                    : 'mr-6 bg-white text-zinc-900 ring-1 ring-zinc-200',
                              ].join(' ')}
                            >
                              {m.text}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <textarea
                          rows={2}
                          className={`${FIELD} min-h-[72px] flex-1 resize-y`}
                          placeholder="Write a message to the client…"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <button
                          type="button"
                          disabled={saving || !replyText.trim()}
                          onClick={async () => {
                            if (!user || !t.id) return;
                            setSaving(true);
                            setBanner(null);
                            const res = await sendThreadMessage({
                              threadId: t.id,
                              senderUserId: user.uid,
                              senderRole: 'photographer',
                              text: replyText,
                            });
                            setSaving(false);
                            if (res.ok) {
                              setReplyText('');
                              setBanner({
                                kind: 'ok',
                                text: 'Message sent.',
                              });
                            } else {
                              setBanner({ kind: 'err', text: res.message });
                            }
                          }}
                          className="h-fit shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                          Send message
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm font-semibold text-zinc-900">
                          Accept
                        </p>
                        <p className="mt-1 text-xs text-zinc-600">
                          Hourly rate × duration for total.
                        </p>
                        <label className="mt-3 block space-y-1">
                          <span className="text-xs font-medium text-zinc-600">
                            Hourly rate ($/hr)
                          </span>
                          <input
                            inputMode="numeric"
                            className={FIELD}
                            disabled={actionsLocked}
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
                          disabled={
                            saving ||
                            typeof acceptRate !== 'number' ||
                            actionsLocked
                          }
                          className="mt-3 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                          onClick={async () => {
                            if (!t.id || typeof acceptRate !== 'number' || !user)
                              return;
                            setSaving(true);
                            setBanner(null);
                            const hrs = durationToHoursApprox(t.duration);
                            const total = Math.round(acceptRate * hrs);
                            const res = await photographerAccept({
                              threadId: t.id,
                              photographerUserId: user.uid,
                              acceptedHourlyRate: acceptRate,
                              acceptedTotalPrice: total,
                              clientUserId: t.clientUserId,
                              photographerName: t.photographerName,
                            });
                            setSaving(false);
                            if (!res.ok) setBanner({ kind: 'err', text: res.message });
                            else {
                              setBanner({
                                kind: 'ok',
                                text: 'Booking accepted. The client has been notified.',
                              });
                              await refreshUserData();
                            }
                          }}
                        >
                          {saving ? 'Saving…' : 'Accept booking'}
                        </button>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm font-semibold text-zinc-900">
                          Suggest alternative
                        </p>
                        <label className="mt-3 block space-y-1">
                          <span className="text-xs font-medium text-zinc-600">
                            Suggested date
                          </span>
                          <input
                            type="date"
                            className={FIELD}
                            disabled={actionsLocked}
                            value={suggestDate}
                            onChange={(e) => setSuggestDate(e.target.value)}
                          />
                        </label>
                        <label className="mt-3 block space-y-1">
                          <span className="text-xs font-medium text-zinc-600">
                            Timeframe (optional)
                          </span>
                          <input
                            className={FIELD}
                            disabled={actionsLocked}
                            value={suggestTimeframe}
                            onChange={(e) => setSuggestTimeframe(e.target.value)}
                            placeholder="e.g. 10am"
                          />
                        </label>
                        <label className="mt-3 block space-y-1">
                          <span className="text-xs font-medium text-zinc-600">
                            Note (optional)
                          </span>
                          <input
                            className={FIELD}
                            disabled={actionsLocked}
                            value={suggestMessage}
                            onChange={(e) => setSuggestMessage(e.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={saving || !suggestDate || actionsLocked}
                          className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                          onClick={async () => {
                            if (!t.id || !user || !suggestDate) return;
                            setSaving(true);
                            setBanner(null);
                            const res = await photographerSuggestAlternative({
                              threadId: t.id,
                              photographerUserId: user.uid,
                              clientUserId: t.clientUserId,
                              photographerName: t.photographerName,
                              suggestedDate: suggestDate,
                              suggestedTimeframe: suggestTimeframe,
                              message: suggestMessage,
                            });
                            setSaving(false);
                            if (!res.ok) setBanner({ kind: 'err', text: res.message });
                            else
                              setBanner({
                                kind: 'ok',
                                text: 'Suggestion sent to the client.',
                              });
                          }}
                        >
                          {saving ? 'Saving…' : 'Send suggestion'}
                        </button>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm font-semibold text-zinc-900">
                          Decline
                        </p>
                        <label className="mt-3 block space-y-1">
                          <span className="text-xs font-medium text-zinc-600">
                            Reason (optional)
                          </span>
                          <input
                            className={FIELD}
                            disabled={actionsLocked}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          disabled={saving || actionsLocked}
                          className="mt-3 w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                          onClick={async () => {
                            if (!t.id || !user) return;
                            setSaving(true);
                            setBanner(null);
                            const res = await photographerDecline({
                              threadId: t.id,
                              photographerUserId: user.uid,
                              clientUserId: t.clientUserId,
                              photographerName: t.photographerName,
                              reason: declineReason,
                            });
                            setSaving(false);
                            if (!res.ok) setBanner({ kind: 'err', text: res.message });
                            else
                              setBanner({
                                kind: 'ok',
                                text: 'Request declined. The client has been notified.',
                              });
                          }}
                        >
                          {saving ? 'Saving…' : 'Decline request'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
