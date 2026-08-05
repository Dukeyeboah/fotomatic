'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import {
  photographerAccept,
  photographerDecline,
  photographerSuggestAlternative,
  type BookingThread,
} from '@/lib/firebase/booking-threads';
import {
  clientBookingAvatarUrl,
  effectivePhotographerDirectoryId,
} from '@/lib/photographer-booking-dashboard';
import { bookingStatusBadge } from '@/lib/booking-status-display';

const FIELD =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

type PriceUnit = 'hour' | 'day' | 'event';

function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function BookingAvatar({
  photoUrl,
  name,
}: {
  photoUrl: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(photoUrl) && !failed;
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-900/5">
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl!}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#e8dfd2] text-[11px] font-semibold text-zinc-700">
          {clientInitials(name)}
        </div>
      )}
    </div>
  );
}

function photographerStatusBadge(status: BookingThread['status']) {
  const base = bookingStatusBadge(status);
  if (status === 'accepted_pending_payment') {
    return { ...base, label: 'Accepted · Pending payment' };
  }
  if (status === 'pending_client_response') {
    return { ...base, label: 'Awaiting client' };
  }
  return base;
}

function durationToHoursApprox(duration: string): number {
  const t = duration.toLowerCase();
  const m = /(\d+(?:\.\d+)?)\s*hour/.exec(t);
  if (m) return Math.max(0.25, Number(m[1]));
  if (t.includes('half day')) return 4;
  if (t.includes('full day')) return 8;
  return 1;
}

function durationToDaysApprox(duration: string): number {
  const t = duration.toLowerCase();
  const m = /(\d+(?:\.\d+)?)\s*day/.exec(t);
  if (m) return Math.max(1, Number(m[1]));
  if (t.includes('full day')) return 1;
  if (t.includes('half day')) return 0.5;
  return 1;
}

function computeAcceptTotal(
  price: number,
  unit: PriceUnit,
  duration: string,
): number {
  if (unit === 'event') return Math.round(price * 100) / 100;
  if (unit === 'day') {
    return Math.round(price * durationToDaysApprox(duration) * 100) / 100;
  }
  return Math.round(price * durationToHoursApprox(duration) * 100) / 100;
}

export function PhotographerBookingsInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');
  const { user, userData, loading: authLoading, refreshUserData } = useAuth();
  const { threads, loading: threadsLoading } =
    usePhotographerBookingThreads();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acceptPrice, setAcceptPrice] = useState<number | ''>('');
  const [acceptUnit, setAcceptUnit] = useState<PriceUnit>('hour');
  const [declineReason, setDeclineReason] = useState('');
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTimeframe, setSuggestTimeframe] = useState('');
  const [suggestMessage, setSuggestMessage] = useState('');
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
    if (!activeThread) return;
    const fromProfile =
      typeof userData?.photographer?.hourlyRate === 'number'
        ? userData.photographer.hourlyRate
        : typeof userData?.photographer?.startingPrice === 'number'
          ? userData.photographer.startingPrice
          : null;
    const fromRequest = activeThread.photographerStartingHourlyRate;
    setAcceptPrice(fromProfile ?? fromRequest ?? '');
    setAcceptUnit(
      activeThread.acceptedPriceUnit === 'day' ||
        activeThread.acceptedPriceUnit === 'event'
        ? activeThread.acceptedPriceUnit
        : 'hour',
    );
    setDeclineReason('');
    setSuggestDate('');
    setSuggestTimeframe('');
    setSuggestMessage('');
    setBanner(null);
  }, [
    activeThread?.id,
    userData?.photographer?.hourlyRate,
    userData?.photographer?.startingPrice,
    activeThread?.status,
    activeThread?.acceptedPriceUnit,
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Bookings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Review each request, accept or suggest an alternative, then message
          the client from Messages when you need to chat.
        </p>
      </div>

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
            const badge = photographerStatusBadge(t.status);
            const quotePreview =
              typeof acceptPrice === 'number' && acceptPrice > 0
                ? computeAcceptTotal(acceptPrice, acceptUnit, t.duration)
                : null;
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
                  <BookingAvatar
                    photoUrl={photo}
                    name={t.clientName || 'Client'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-900">
                      {t.clientName || 'Client'}
                    </p>
                    <p className="truncate text-xs text-zinc-600">
                      {t.eventType} · {t.eventDate}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </button>

                {open && t.id ? (
                  <div className="space-y-5 border-t border-zinc-100 px-4 pb-6 pt-4">
                    {actionsLocked ? (
                      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                        Accept / decline / suggest are only available while this
                        booking is <strong>Requested</strong>.
                      </p>
                    ) : null}

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                      <div className="min-w-0 shrink-0 xl:max-w-[220px]">
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
                          Shown to client: From $
                          {t.photographerStartingHourlyRate}
                        </p>
                        <Link
                          href={`/photographer/messages?thread=${encodeURIComponent(t.id)}`}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                        >
                          <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                          Message client
                        </Link>
                      </div>

                      <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-3">
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <p className="text-sm font-semibold text-zinc-900">
                            Accept
                          </p>
                          <div className="mt-2 flex gap-2">
                            <div className="relative min-w-0 flex-1">
                              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">
                                $
                              </span>
                              <input
                                inputMode="decimal"
                                className={`${FIELD} pl-7`}
                                disabled={actionsLocked}
                                value={acceptPrice}
                                onChange={(e) => {
                                  const v = e.target.value.trim();
                                  if (!v) setAcceptPrice('');
                                  else setAcceptPrice(Number(v));
                                }}
                              />
                            </div>
                            <select
                              className={`${FIELD} w-[7.5rem] shrink-0`}
                              disabled={actionsLocked}
                              value={acceptUnit}
                              onChange={(e) =>
                                setAcceptUnit(e.target.value as PriceUnit)
                              }
                            >
                              <option value="hour">/ hour</option>
                              <option value="day">/ day</option>
                              <option value="event">/ event</option>
                            </select>
                          </div>
                          {quotePreview != null ? (
                            <p className="mt-2 text-[11px] text-zinc-500">
                              Client pays ${quotePreview.toFixed(2)} for this
                              booking ({t.duration})
                            </p>
                          ) : null}
                          <button
                            type="button"
                            disabled={
                              saving ||
                              typeof acceptPrice !== 'number' ||
                              !Number.isFinite(acceptPrice) ||
                              acceptPrice <= 0 ||
                              actionsLocked
                            }
                            className="mt-2 w-full rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
                            onClick={async () => {
                              if (
                                !t.id ||
                                typeof acceptPrice !== 'number' ||
                                !user
                              )
                                return;
                              const total = computeAcceptTotal(
                                acceptPrice,
                                acceptUnit,
                                t.duration,
                              );
                              if (!Number.isFinite(total) || total < 0.5) {
                                setBanner({
                                  kind: 'err',
                                  text: 'Quote total must be at least $0.50.',
                                });
                                return;
                              }
                              setSaving(true);
                              setBanner(null);
                              const res = await photographerAccept({
                                threadId: t.id,
                                photographerUserId: user.uid,
                                acceptedHourlyRate: acceptPrice,
                                acceptedPriceUnit: acceptUnit,
                                acceptedTotalPrice: total,
                                clientUserId: t.clientUserId,
                                photographerName: t.photographerName,
                              });
                              setSaving(false);
                              if (!res.ok)
                                setBanner({ kind: 'err', text: res.message });
                              else {
                                setBanner({
                                  kind: 'ok',
                                  text: `Accepted at $${acceptPrice}/${acceptUnit}. Client can pay $${total.toFixed(2)}.`,
                                });
                                await refreshUserData();
                              }
                            }}
                          >
                            {saving
                              ? 'Saving…'
                              : quotePreview != null
                                ? `Accept · $${quotePreview.toFixed(2)}`
                                : 'Accept'}
                          </button>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <p className="text-sm font-semibold text-zinc-900">
                            Decline
                          </p>
                          <label className="mt-2 block space-y-1">
                            <span className="text-[11px] font-medium text-zinc-600">
                              Reason (optional)
                            </span>
                            <input
                              className={FIELD}
                              disabled={actionsLocked}
                              value={declineReason}
                              onChange={(e) =>
                                setDeclineReason(e.target.value)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            disabled={saving || actionsLocked}
                            className="mt-2 w-full rounded-xl bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
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
                              if (!res.ok)
                                setBanner({ kind: 'err', text: res.message });
                              else
                                setBanner({
                                  kind: 'ok',
                                  text: 'Request declined. The client has been notified.',
                                });
                            }}
                          >
                            {saving ? 'Saving…' : 'Decline'}
                          </button>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                          <p className="text-sm font-semibold text-zinc-900">
                            Suggest alternative
                          </p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <label className="block space-y-1">
                              <span className="text-[11px] font-medium text-zinc-600">
                                Date
                              </span>
                              <input
                                type="date"
                                className={FIELD}
                                disabled={actionsLocked}
                                value={suggestDate}
                                onChange={(e) =>
                                  setSuggestDate(e.target.value)
                                }
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-[11px] font-medium text-zinc-600">
                                Time
                              </span>
                              <input
                                className={FIELD}
                                disabled={actionsLocked}
                                value={suggestTimeframe}
                                onChange={(e) =>
                                  setSuggestTimeframe(e.target.value)
                                }
                                placeholder="e.g. 10am"
                              />
                            </label>
                          </div>
                          <label className="mt-2 block space-y-1">
                            <span className="text-[11px] font-medium text-zinc-600">
                              Note
                            </span>
                            <input
                              className={FIELD}
                              disabled={actionsLocked}
                              value={suggestMessage}
                              onChange={(e) =>
                                setSuggestMessage(e.target.value)
                              }
                            />
                          </label>
                          <button
                            type="button"
                            disabled={
                              saving || !suggestDate || actionsLocked
                            }
                            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                            onClick={async () => {
                              if (!t.id || !user || !suggestDate) return;
                              setSaving(true);
                              setBanner(null);
                              const res =
                                await photographerSuggestAlternative({
                                  threadId: t.id,
                                  photographerUserId: user.uid,
                                  clientUserId: t.clientUserId,
                                  photographerName: t.photographerName,
                                  suggestedDate: suggestDate,
                                  suggestedTimeframe: suggestTimeframe,
                                  message: suggestMessage,
                                });
                              setSaving(false);
                              if (!res.ok)
                                setBanner({ kind: 'err', text: res.message });
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
