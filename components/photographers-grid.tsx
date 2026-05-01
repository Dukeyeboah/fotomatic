'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookingRequestModal } from '@/components/booking-request-modal';
import {
  type DirectoryPhotographer,
  photographerPlaceholderImagePath,
} from '@/lib/photographers-directory';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { MapPin, AtSign, ArrowUpRight, Heart } from 'lucide-react';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';

function getPhotographerName(p: DirectoryPhotographer) {
  if (p.lastName) return `${p.firstName} ${p.lastName}`.trim();
  return p.firstName;
}

function formatStartingRate(p: DirectoryPhotographer): string {
  return `From $${p.startingHourlyRate}/hr`;
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
  return 'Location coming soon';
}

function normalizeUrl(href: string, kind: 'web' | 'ig'): string {
  const t = href.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (kind === 'ig') {
    const handle = t.replace(/^@/, '');
    return `https://instagram.com/${handle}`;
  }
  return `https://${t.replace(/^\/\//, '')}`;
}

export function PhotographersGrid({
  promoLabel,
  variant = 'marketing',
}: {
  /** Shown when a referral/discount code is active (e.g. from Grad Drive link). */
  promoLabel?: string | null;
  /** `embedded`: tighter layout for dashboard shell */
  variant?: 'marketing' | 'embedded';
}) {
  const list = useMergedDirectoryPhotographers();
  const [q, setQ] = useState('');
  const [bookingPhotographer, setBookingPhotographer] =
    useState<DirectoryPhotographer | null>(null);
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { toggle, isSaved } = useSavedPhotographerIds();

  const filtered = list.filter((p) => {
    if (!q) return true;
    const n = getPhotographerName(p).toLowerCase();
    const loc = formatLocation(p).toLowerCase();
    const qq = q.toLowerCase();
    return n.includes(qq) || loc.includes(qq);
  });

  const openBooking = (p: DirectoryPhotographer) => {
    if (!user) {
      openLoginModal();
      return;
    }
    setBookingPhotographer(p);
  };

  const embedded = variant === 'embedded';

  return (
    <div
      className={[
        'mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8',
        embedded ? 'py-6 lg:py-8' : 'py-14',
      ].join(' ')}
    >
      <div className={embedded ? 'space-y-2 text-left' : 'space-y-3 text-center'}>
        {!embedded ? (
          <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
            DIRECTORY
          </p>
        ) : null}
        <h1
          className={[
            'font-serif font-medium tracking-tight text-zinc-900',
            embedded ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl',
          ].join(' ')}
        >
          Find a photographer
        </h1>
        <p
          className={[
            'text-zinc-600',
            embedded ? 'max-w-xl text-sm' : 'mx-auto max-w-lg',
          ].join(' ')}
        >
          Book a photographer of your choice.
        </p>
        {promoLabel ? (
          <p className="inline-block rounded-full border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm font-medium text-amber-900">
            {promoLabel}
          </p>
        ) : null}
      </div>

      <div className={embedded ? 'flex justify-start' : 'flex justify-center'}>
        <input
          type="search"
          placeholder="Search by name or location…"
          className="w-full max-w-md rounded-full border border-zinc-200/80 bg-white px-5 py-3 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 shadow-sm outline-none ring-zinc-900/0 transition-shadow focus:ring-2 focus:ring-amber-900/15"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No photographers found.
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const photo = p.photoUrl?.trim();
            const ig = p.instagram?.trim();
            const web = p.website?.trim();
            const tw = p.twitter?.trim();
            const fb = p.facebook?.trim();
            const igHref = ig ? normalizeUrl(ig, 'ig') : '';
            const webHref = web ? normalizeUrl(web, 'web') : '';
            const twHref = tw ? normalizeUrl(tw, 'web') : '';
            const fbHref = fb ? normalizeUrl(fb, 'web') : '';

            return (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-[#faf8f5] shadow-sm ring-1 ring-zinc-900/5 transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-200/80 to-stone-100">
                  <button
                    type="button"
                    title={
                      isSaved(p.id) ? 'Remove from saved' : 'Save photographer'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        openLoginModal();
                        return;
                      }
                      toggle(p.id);
                    }}
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md ring-1 ring-zinc-900/10 transition-colors hover:bg-white"
                  >
                    <Heart
                      className={`h-5 w-5 ${isSaved(p.id) ? 'fill-red-500 text-red-500' : 'text-zinc-700'}`}
                      strokeWidth={1.75}
                    />
                  </button>
                  {photo ? (
                    /^https?:\/\//i.test(photo) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote photographer URLs
                      <img
                        src={photo}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={photo.startsWith('/') ? photo : `/${photo}`}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )
                  ) : (
                    <Image
                      src={photographerPlaceholderImagePath(p.id)}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-lg font-semibold text-zinc-900">
                        {getPhotographerName(p)}
                      </h2>
                      <span className="shrink-0 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800">
                        {formatStartingRate(p)}
                      </span>
                    </div>
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-zinc-600">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {formatLocation(p)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {igHref ? (
                      <a
                        href={igHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300"
                      >
                        <AtSign className="h-3.5 w-3.5" />
                        Instagram
                        <ArrowUpRight className="h-3 w-3 opacity-50" />
                      </a>
                    ) : null}
                    {webHref ? (
                      <a
                        href={webHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300"
                      >
                        Website
                        <ArrowUpRight className="h-3 w-3 opacity-50" />
                      </a>
                    ) : null}
                    {twHref ? (
                      <a
                        href={twHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300"
                      >
                        X / Twitter
                        <ArrowUpRight className="h-3 w-3 opacity-50" />
                      </a>
                    ) : null}
                    {fbHref ? (
                      <a
                        href={fbHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300"
                      >
                        Facebook
                        <ArrowUpRight className="h-3 w-3 opacity-50" />
                      </a>
                    ) : null}
                    {!igHref && !webHref && !twHref && !fbHref ? (
                      <span className="text-xs text-zinc-400">
                        Links coming soon
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => openBooking(p)}
                    className="mt-auto w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    Request booking
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {bookingPhotographer && user ? (
        <BookingRequestModal
          photographer={bookingPhotographer}
          user={user}
          userData={userData}
          promoLabel={promoLabel}
          onClose={() => setBookingPhotographer(null)}
        />
      ) : null}
    </div>
  );
}
