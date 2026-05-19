'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { savePhotographerApplication } from '@/lib/firebase/firestore';
import { COUNTRY_NAMES } from '@/lib/countries';
import {
  resolvePhotographyFocusesFromForm,
  serializePhotographyFocuses,
} from '@/lib/photography-focus';
import { PhotographyFocusPicker } from '@/components/photography-focus-picker';
import { PhotographerPricingFields } from '@/components/photographer-pricing-fields';
import {
  clampStartingPrice,
  sanitizeEventPricingRows,
  sanitizePricingNotes,
} from '@/lib/photographer-pricing';
import type { FocusEventPricing } from '@/lib/photographer-pricing';
import { PHOTOGRAPHY_FOCUS_OPTIONS } from '@/lib/photography-focus';
import { CheckCircle2, Loader2, X } from 'lucide-react';

const DRAFT_STORAGE_KEY = 'fotomatic_join_photographer_draft_v1';

function emptyApplyForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: '',
    startingPrice: '',
    bio: '',
    photoFocusSelected: [] as string[],
    photoFocusOther: '',
    pricingNotes: '',
    eventPricing: [] as FocusEventPricing[],
    phone: '',
    phoneContact: false,
    emailContact: false,
    instagram: '',
    twitter: '',
    facebook: '',
    website: '',
    portfolioLinks: '',
    serviceArea: '',
    openToOtherAreas: false,
    interestedInClientWork: false,
    howDidYouHear: '',
  };
}

type ApplyPayload = {
  applicantUserId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
  country: string;
  address: string;
  startingPrice: number;
  startingHourlyRate: number;
  bio: string;
  photographyFocus: string;
  photographyFocuses: string[];
  eventPricing?: FocusEventPricing[];
  pricingNotes?: string;
  phone: string;
  phoneContact: boolean;
  emailContact: boolean;
  instagram: string;
  twitter: string;
  facebook: string;
  website: string;
  portfolioLinks: string;
  serviceArea: string;
  openToOtherAreas: boolean;
  interestedInClientWork: boolean;
  howDidYouHear: string;
};

export function JoinPhotographerModal({
  open,
  onClose,
  loginRedirectTo = '/#get-started',
}: {
  open: boolean;
  onClose: () => void;
  /** Where to send users who must sign in before applying (e.g. dashboard vs landing). */
  loginRedirectTo?: string;
}) {
  const { user, userData, loading } = useAuth();
  const alreadyPhotographer = userData?.role === 'photographer';
  const { openLoginModal } = useLoginModal();
  const [apply, setApply] = useState(emptyApplyForm);
  const [applyStatus, setApplyStatus] = useState<
    'idle' | 'loading' | 'ok' | 'err'
  >('idle');
  const prevOpenRef = useRef(false);

  /** When the dialog opens, hydrate from session draft + account defaults. */
  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }
    if (prevOpenRef.current) return;
    prevOpenRef.current = true;

    let next = emptyApplyForm();
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          next = { ...next, ...(parsed as typeof next) };
          const legacy = parsed as Record<string, unknown>;
          if (
            !next.startingPrice &&
            typeof legacy.startingHourlyRate === 'string'
          ) {
            next.startingPrice = legacy.startingHourlyRate;
          }
          if (
            (!next.photoFocusSelected || next.photoFocusSelected.length === 0) &&
            typeof legacy.photoFocusChoice === 'string' &&
            legacy.photoFocusChoice
          ) {
            const choice = String(legacy.photoFocusChoice);
            next.photoFocusSelected = [choice];
            if (choice === 'Other' && typeof legacy.photoFocusOther === 'string') {
              next.photoFocusOther = legacy.photoFocusOther;
            }
          }
        }
      }
    } catch {
      /* ignore */
    }
    if (user) {
      const parts =
        user.displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
      next.email = (next.email || user.email || '').trim();
      next.firstName = (next.firstName || parts[0] || '').trim();
      next.lastName = (
        next.lastName ||
        (parts.length > 1 ? parts.slice(1).join(' ') : '')
      ).trim();
    }
    setApply(next);
    setApplyStatus('idle');
  }, [open, user]);

  /** If the user signs in while the modal stays open, fill blanks from Auth. */
  useEffect(() => {
    if (!open || !user) return;
    setApply((s) => ({
      ...s,
      email: (s.email || user.email || '').trim(),
      firstName:
        (s.firstName || user.displayName?.trim().split(/\s+/)[0] || '').trim(),
      lastName: (
        s.lastName ||
        (user.displayName?.trim().includes(' ')
          ? user.displayName.trim().split(/\s+/).slice(1).join(' ')
          : '')
      ).trim(),
    }));
  }, [open, user]);

  useEffect(() => {
    if (!open || alreadyPhotographer || applyStatus === 'ok') return;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(apply));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [open, apply, alreadyPhotographer, applyStatus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onApply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (userData?.role === 'photographer') return;
      if (!user) {
        try {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(apply));
        } catch {
          /* ignore */
        }
        openLoginModal({ redirectTo: loginRedirectTo });
        return;
      }
      const rate = clampStartingPrice(Number(apply.startingPrice));
      const focusResolved = resolvePhotographyFocusesFromForm({
        selectedPresets: apply.photoFocusSelected,
        otherText: apply.photoFocusOther,
      });
      const focusSummary = serializePhotographyFocuses(focusResolved);
      const cleanedPricing = sanitizeEventPricingRows(
        apply.eventPricing,
        [...PHOTOGRAPHY_FOCUS_OPTIONS, ...focusResolved],
      );
      const notes = sanitizePricingNotes(apply.pricingNotes);
      const bioWords = apply.bio.trim().split(/\s+/).filter(Boolean).length;
      if (
        !apply.firstName.trim() ||
        !apply.lastName.trim() ||
        !apply.email.trim() ||
        !apply.city.trim() ||
        !apply.country.trim() ||
        focusResolved.length === 0 ||
        !Number.isFinite(rate) ||
        !apply.bio.trim() ||
        bioWords > 150
      ) {
        setApplyStatus('err');
        return;
      }
      const displayName =
        `${apply.firstName.trim()} ${apply.lastName.trim()}`.trim();
      const payload: ApplyPayload = {
        applicantUserId: user.uid,
        name: displayName,
        firstName: apply.firstName.trim(),
        lastName: apply.lastName.trim(),
        email: apply.email.trim(),
        city: apply.city.trim(),
        state: apply.state.trim(),
        country: apply.country.trim(),
        address: apply.address.trim(),
        startingPrice: rate,
        startingHourlyRate: rate,
        bio: apply.bio.trim(),
        photographyFocus: focusSummary,
        photographyFocuses: focusResolved,
        ...(cleanedPricing.length > 0 ? { eventPricing: cleanedPricing } : {}),
        ...(notes ? { pricingNotes: notes } : {}),
        phone: apply.phone.trim(),
        phoneContact: apply.phoneContact,
        emailContact: apply.emailContact,
        instagram: apply.instagram.trim(),
        twitter: apply.twitter.trim(),
        facebook: apply.facebook.trim(),
        website: apply.website.trim(),
        portfolioLinks: apply.portfolioLinks.trim(),
        serviceArea: apply.serviceArea.trim(),
        openToOtherAreas: apply.openToOtherAreas,
        interestedInClientWork: apply.interestedInClientWork,
        howDidYouHear: apply.howDidYouHear.trim(),
      };

      setApplyStatus('loading');
      const saved = await savePhotographerApplication(payload);
      if (!saved) {
        setApplyStatus('err');
        return;
      }

      try {
        const res = await fetch('/api/notify-photographer-application', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          console.warn(
            '[JoinPhotographerModal] notify email failed',
            await res.text(),
          );
        }
      } catch (e) {
        console.warn('[JoinPhotographerModal] notify request error', e);
      }

      setApplyStatus('ok');
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setApply(emptyApplyForm());
    },
    [apply, user, userData?.role, openLoginModal, loginRedirectTo],
  );

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-[60] flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='join-modal-title'
    >
      <button
        type='button'
        className='absolute inset-0 bg-zinc-900/40 backdrop-blur-sm'
        aria-label='Close'
        onClick={onClose}
      />
      <div className='relative z-10 flex max-h-[min(90vh,800px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-zinc-900/10'>
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-6 py-4'>
          <div>
            <p className='text-[11px] font-semibold tracking-[0.22em] text-amber-900/70'>
              APPLY
            </p>
            <h2
              id='join-modal-title'
              className='mt-1 font-serif text-xl font-medium text-zinc-900'
            >
              Join as a photographer
            </h2>
            <p className='mt-1 text-sm text-zinc-600'>
              We’ll review your details and follow up by email.
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900'
            aria-label='Close dialog'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
          {applyStatus === 'ok' ? (
            <div className='space-y-4 py-4 text-center'>
              <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700'>
                <CheckCircle2 className='h-7 w-7' />
              </div>
              <p className='font-medium text-zinc-900'>
                Your application has been submitted.
              </p>
              <p className='text-sm leading-relaxed text-zinc-600'>
                You’ll hear from us soon about next steps. Thank you for your
                interest in Fotomatic.
              </p>
              <button
                type='button'
                onClick={onClose}
                className='mt-2 w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800'
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={onApply} className='space-y-4'>
              {!loading && alreadyPhotographer ? (
                <div className='rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800'>
                  You are already a photographer on Fotomatic. Profile and bookings
                  are available from your account menu.
                </div>
              ) : null}
              {!loading && !user ? (
                <div className='rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950'>
                  <p>
                    You can fill out the form now — we save your progress in this
                    browser. When you&apos;re ready, use{' '}
                    <span className='font-semibold'>Submit application</span> and
                    you&apos;ll be asked to{' '}
                    <button
                      type='button'
                      className='font-semibold underline'
                      onClick={() => openLoginModal({ redirectTo: loginRedirectTo })}
                    >
                      log in or sign up
                    </button>{' '}
                    so we can receive it.
                  </p>
                </div>
              ) : null}
              <fieldset
                disabled={alreadyPhotographer}
                className='min-w-0 space-y-4 border-0 p-0 disabled:opacity-70'
              >
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='block space-y-1'>
                  <span className='text-xs font-medium text-zinc-600'>
                    First name <span className='text-red-600'>*</span>
                  </span>
                  <input
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.firstName}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, firstName: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Last name <span className='text-red-600'>*</span>
                  </span>
                  <input
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.lastName}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, lastName: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Email <span className='text-red-600'>*</span>
                  </span>
                  <input
                    type='email'
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.email}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, email: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Street address <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.address}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, address: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1'>
                  <span className='text-xs font-medium text-zinc-600'>
                    City <span className='text-red-600'>*</span>
                  </span>
                  <input
                    required
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.city}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, city: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1'>
                  <span className='text-xs font-medium text-zinc-600'>
                    State / region <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='If applicable'
                    value={apply.state}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, state: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Country <span className='text-red-600'>*</span>
                  </span>
                  <select
                    required
                    className='w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.country}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, country: e.target.value }))
                    }
                  >
                    <option value=''>Select country</option>
                    {COUNTRY_NAMES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <PhotographyFocusPicker
                  className='sm:col-span-2'
                  required
                  selected={apply.photoFocusSelected}
                  onChange={(photoFocusSelected) =>
                    setApply((s) => ({ ...s, photoFocusSelected }))
                  }
                  otherText={apply.photoFocusOther}
                  onOtherTextChange={(photoFocusOther) =>
                    setApply((s) => ({ ...s, photoFocusOther }))
                  }
                />
                <div className='sm:col-span-2'>
                  <PhotographerPricingFields
                    startingPrice={
                      apply.startingPrice === ''
                        ? ''
                        : Number(apply.startingPrice)
                    }
                    onStartingPriceChange={(v) =>
                      setApply((s) => ({
                        ...s,
                        startingPrice: v === '' ? '' : String(v),
                      }))
                    }
                    pricingNotes={apply.pricingNotes}
                    onPricingNotesChange={(pricingNotes) =>
                      setApply((s) => ({ ...s, pricingNotes }))
                    }
                    selectedFocuses={resolvePhotographyFocusesFromForm({
                      selectedPresets: apply.photoFocusSelected,
                      otherText: apply.photoFocusOther,
                    })}
                    eventPricing={apply.eventPricing}
                    onEventPricingChange={(eventPricing) =>
                      setApply((s) => ({ ...s, eventPricing }))
                    }
                  />
                </div>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Short bio <span className='text-red-600'>*</span>{' '}
                    <span className='font-normal text-zinc-400'>(max ~150 words)</span>
                  </span>
                  <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    className='w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.bio}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, bio: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Primary service area <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='Regions you usually work in'
                    value={apply.serviceArea}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, serviceArea: e.target.value }))
                    }
                  />
                </label>
                <label className='flex cursor-pointer items-start gap-3 text-sm text-zinc-700 sm:col-span-2'>
                  <input
                    type='checkbox'
                    className='mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30'
                    checked={apply.openToOtherAreas}
                    onChange={(e) =>
                      setApply((s) => ({
                        ...s,
                        openToOtherAreas: e.target.checked,
                      }))
                    }
                  />
                  <span>Open to traveling or serving nearby regions beyond my primary area.</span>
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Phone <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.phone}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </label>
                <div className='flex flex-col gap-3 sm:col-span-2'>
                  <label className='flex cursor-pointer items-start gap-3 text-sm text-zinc-700'>
                    <input
                      type='checkbox'
                      className='mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30'
                      checked={apply.phoneContact}
                      onChange={(e) =>
                        setApply((s) => ({
                          ...s,
                          phoneContact: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      Clients may contact me by phone for booking-related questions.
                      If unchecked, we won&apos;t show your number publicly.
                    </span>
                  </label>
                  <label className='flex cursor-pointer items-start gap-3 text-sm text-zinc-700'>
                    <input
                      type='checkbox'
                      className='mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30'
                      checked={apply.emailContact}
                      onChange={(e) =>
                        setApply((s) => ({
                          ...s,
                          emailContact: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      Clients may contact me by email for booking-related questions.
                    </span>
                  </label>
                </div>
                <p className='text-[11px] leading-snug text-zinc-500 sm:col-span-2'>
                  Social links: paste full profile URLs (starting with{' '}
                  <span className='font-mono text-zinc-600'>https://</span>), not
                  @handles.
                </p>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Instagram profile URL{' '}
                    <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='https://www.instagram.com/yourprofile'
                    value={apply.instagram}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, instagram: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    X (Twitter) profile URL{' '}
                    <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='https://x.com/yourprofile'
                    value={apply.twitter}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, twitter: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Facebook profile or page URL{' '}
                    <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='https://www.facebook.com/yourprofile'
                    value={apply.facebook}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, facebook: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Website URL{' '}
                    <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='https://yourdomain.com'
                    value={apply.website}
                    onChange={(e) =>
                      setApply((s) => ({ ...s, website: e.target.value }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    Other portfolio / links <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <textarea
                    rows={2}
                    className='w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    placeholder='URLs separated by spaces or new lines'
                    value={apply.portfolioLinks}
                    onChange={(e) =>
                      setApply((s) => ({
                        ...s,
                        portfolioLinks: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className='block space-y-1 sm:col-span-2'>
                  <span className='text-xs font-medium text-zinc-600'>
                    How did you hear about Fotomatic?{' '}
                    <span className='font-normal text-zinc-400'>(optional)</span>
                  </span>
                  <input
                    className='w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20'
                    value={apply.howDidYouHear}
                    onChange={(e) =>
                      setApply((s) => ({
                        ...s,
                        howDidYouHear: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className='flex cursor-pointer items-start gap-3 text-sm text-zinc-700'>
                <input
                  type='checkbox'
                  className='mt-1 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30'
                  checked={apply.interestedInClientWork}
                  onChange={(e) =>
                    setApply((s) => ({
                      ...s,
                      interestedInClientWork: e.target.checked,
                    }))
                  }
                />
                <span>
                  I’m interested in being connected with clients who need a
                  photographer for graduations, portraits, events, and similar
                  shoots.
                </span>
              </label>
              {applyStatus === 'err' ? (
                <p className='text-sm font-medium text-red-600'>
                  Something went wrong. Check required fields and try again, or
                  email{' '}
                  <a
                    href='mailto:contact@houseofstole.com'
                    className='underline'
                  >
                    contact@houseofstole.com
                  </a>
                  .
                </p>
              ) : null}
              <button
                type='submit'
                disabled={applyStatus === 'loading' || alreadyPhotographer}
                className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60'
              >
                {applyStatus === 'loading' ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Submitting…
                  </>
                ) : (
                  'Submit application'
                )}
              </button>
              </fieldset>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
