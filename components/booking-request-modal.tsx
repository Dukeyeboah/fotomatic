'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { UserData } from '@/lib/firebase/user-profile';
import {
  BOOKING_DURATION_PRESETS,
  BOOKING_EVENT_TYPES,
} from '@/lib/booking-request';
import type { DirectoryPhotographer } from '@/lib/photographers-directory';
import { createBookingThread } from '@/lib/firebase/booking-threads';
import { CalendarDays, Loader2, X } from 'lucide-react';

function getPhotographerName(p: DirectoryPhotographer): string {
  if (p.lastName) return `${p.firstName} ${p.lastName}`.trim();
  return p.firstName;
}

function formatLocation(p: DirectoryPhotographer): string {
  const city = p.city?.trim();
  const state = p.state?.trim();
  const country = p.country?.trim();
  if (city && state && country) return `${city}, ${state} · ${country}`;
  if (city && state) return `${city}, ${state}`;
  if (state && country) return `${state} · ${country}`;
  if (state) return `${state}, United States`;
  if (city) return city;
  return '—';
}

function formatStartingRate(p: DirectoryPhotographer): string {
  return `From $${p.startingHourlyRate}/hr`;
}

type Props = {
  photographer: DirectoryPhotographer | null;
  user: User;
  userData: UserData | null;
  promoLabel?: string | null;
  onClose: () => void;
};

export function BookingRequestModal({
  photographer,
  user,
  userData,
  promoLabel,
  onClose,
}: Props) {
  const inputClass =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-amber-900/20';
  const selectClass =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';
  const textareaClass =
    'w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-amber-900/20';

  const [eventType, setEventType] = useState<string>(BOOKING_EVENT_TYPES[0]!);
  const [eventLocation, setEventLocation] = useState('');
  const [duration, setDuration] = useState<string>(
    BOOKING_DURATION_PRESETS[0]!,
  );
  /** `YYYY-MM-DD` from calendar input */
  const [preferredDate, setPreferredDate] = useState('');
  /** Optional: time of day, flexibility, multi-day window */
  const [eventTimeframe, setEventTimeframe] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToContract, setAgreedToContract] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photographer) return;
    setEventType(BOOKING_EVENT_TYPES[0]!);
    setEventLocation('');
    setDuration(BOOKING_DURATION_PRESETS[0]!);
    setPreferredDate('');
    setEventTimeframe('');
    setNotes('');
    setAgreedToContract(false);
    setError(null);
  }, [photographer?.id]);

  useEffect(() => {
    if (!photographer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photographer, onClose]);

  if (!photographer) return null;

  const userName =
    userData?.displayName ?? user.displayName ?? user.email ?? 'Unknown';
  const userEmail = userData?.email ?? user.email ?? '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!eventLocation.trim()) {
      setError('Please enter the event or shoot location.');
      return;
    }
    if (!preferredDate.trim()) {
      setError('Please choose a preferred date on the calendar.');
      return;
    }
    if (!agreedToContract) {
      setError('Please agree to the standard contract terms to continue.');
      return;
    }
    setSending(true);
    const promoNote = promoLabel?.trim().slice(0, 499);
    const eventDate = preferredDate.trim();
    const result = await createBookingThread({
      clientUserId: user.uid,
      clientName: userName,
      clientEmail: userEmail,
      photographerDirectoryId: photographer.id,
      photographerName: getPhotographerName(photographer),
      photographerStartingHourlyRate: photographer.startingHourlyRate,
      eventType: eventType.trim(),
      eventDate,
      eventTimeframe: eventTimeframe.trim(),
      duration: duration.trim(),
      eventLocation: eventLocation.trim(),
      clientMessage: notes.trim(),
      agreedToContract,
      promoNote: promoNote ?? null,
    });
    setSending(false);
    if (result.ok) {
      alert(
        `Request sent for ${getPhotographerName(photographer)}. Our team will follow up.`,
      );
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-zinc-900/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-[#faf8f5] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="booking-modal-title"
              className="font-serif text-xl font-medium text-zinc-900"
            >
              Request booking
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Tell us about your shoot. We&apos;ll route this to our team and the
              photographer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200/80 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Photographer
          </p>
          <p className="mt-1 font-medium text-zinc-900">
            {getPhotographerName(photographer)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-zinc-600">
            <p className="text-sm">{formatLocation(photographer)}</p>
            <p className="text-sm font-semibold text-zinc-900">
              {formatStartingRate(photographer)}
            </p>
          </div>
        </div>

        {promoLabel ? (
          <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
            {promoLabel}
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </p>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Event type</span>
            <select
              required
              className={selectClass}
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {BOOKING_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">
              Event / shoot location
            </span>
            <input
              required
              className={inputClass}
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Venue, neighborhood, or city"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Duration</span>
            <select
              required
              className={selectClass}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {BOOKING_DURATION_PRESETS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-3 rounded-xl border border-zinc-200/80 bg-white p-4">
            <legend className="flex items-center gap-2 px-1 text-xs font-semibold text-zinc-800">
              <CalendarDays className="h-3.5 w-3.5 text-amber-900/80" aria-hidden />
              Preferred date and timeframe
            </legend>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">
                Date <span className="text-red-600">*</span>
              </span>
              <input
                type="date"
                required
                className={`${inputClass} cursor-pointer`}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
              <span className="text-[11px] leading-snug text-zinc-500">
                Opens your device or browser calendar. Pick the main day you have
                in mind (you can refine timing below).
              </span>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">
                Time or flexibility{' '}
                <span className="font-normal text-zinc-400">(optional)</span>
              </span>
              <input
                type="text"
                className={inputClass}
                value={eventTimeframe}
                onChange={(e) => setEventTimeframe(e.target.value)}
                placeholder="e.g. 2pm start, golden hour, or flexible that week"
              />
            </label>
          </fieldset>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">
              Additional details
            </span>
            <textarea
              rows={4}
              className={textareaClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Timing, shot list, budget range, references…"
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-zinc-200/80 bg-white p-4">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900"
              checked={agreedToContract}
              onChange={(e) => setAgreedToContract(e.target.checked)}
            />
            <span className="text-sm text-zinc-700">
              I agree to Fotomatic&apos;s standard contract terms for bookings.
            </span>
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
