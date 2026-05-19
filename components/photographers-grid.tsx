'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookingRequestModal } from '@/components/booking-request-modal';
import {
  type DirectoryPhotographer,
  directoryPhotographerHeroImageUrl,
} from '@/lib/photographers-directory';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { MapPin, Heart } from 'lucide-react';
import { PhotographerSocialIconButtons } from '@/components/photographer-social-icon-buttons';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { usePhotographerDirectoryReviewStats } from '@/lib/hooks/use-directory-review-stats';
import { StarRow } from '@/components/photographer-reviews-panel';
import { directoryListingFallbackImageUrl } from '@/lib/fotomatic-marketing-images';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';

function getPhotographerName(p: DirectoryPhotographer): string {
  if (p.lastName) return `${p.firstName} ${p.lastName}`.trim();
  return p.firstName;
}

function formatStartingRate(p: DirectoryPhotographer): string {
  return formatDirectoryStartingPrice(p);
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
  const [detailPhotographer, setDetailPhotographer] =
    useState<DirectoryPhotographer | null>(null);
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const { toggle, isSaved } = useSavedPhotographerIds();
  const reviewStats = usePhotographerDirectoryReviewStats();

  const viewerForSelf = useMemo(
    () => ({
      uid: user?.uid,
      role: userData?.role,
      directoryId: userData?.photographer?.directoryId,
    }),
    [user?.uid, userData?.role, userData?.photographer?.directoryId],
  );

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
            const photo = directoryPhotographerHeroImageUrl(p);
            const canBook = !isOwnDirectoryPhotographerListing(p, viewerForSelf);
            return (
              <article
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest('button, a')) return;
                  setDetailPhotographer(p);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const t = e.target as HTMLElement;
                    if (t.closest('button, a')) return;
                    setDetailPhotographer(p);
                  }
                }}
                aria-label={`${getPhotographerName(p)} — open details`}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-[#faf8f5] shadow-sm ring-1 ring-zinc-900/5 transition-shadow hover:shadow-md"
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
                      src={directoryListingFallbackImageUrl()}
                      alt=""
                      fill
                      className="object-contain bg-white p-10 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
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
                    {(() => {
                      const s = reviewStats.get(p.id);
                      if (!s || s.count < 1) return null;
                      return (
                        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                          <StarRow value={s.average} size="sm" />
                          <span>
                            {s.average.toFixed(1)} · {s.count} review
                            {s.count === 1 ? '' : 's'}
                          </span>
                        </p>
                      );
                    })()}
                  </div>
                  <div
                    className="flex flex-wrap gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PhotographerSocialIconButtons
                      size="sm"
                      instagram={p.instagram}
                      website={p.website}
                      twitter={p.twitter}
                      facebook={p.facebook}
                      portfolioLinks={p.portfolioLinks}
                    />
                    {!p.instagram?.trim() &&
                    !p.website?.trim() &&
                    !p.twitter?.trim() &&
                    !p.facebook?.trim() &&
                    !(p.portfolioLinks ?? '').trim() ? (
                      <span className="text-xs text-zinc-400">
                        Links coming soon
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-auto flex flex-col gap-2">
                    {p.profileSlug ? (
                      <Link
                        href={publicPhotographerProfilePath(p.profileSlug)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex w-full items-center justify-center rounded-xl border border-zinc-300 bg-white py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
                      >
                        View full profile
                      </Link>
                    ) : (
                      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-2 text-center text-[11px] leading-snug text-zinc-600">
                        <p className="font-medium text-zinc-800">
                          No public profile link
                        </p>
                        {isOwnDirectoryPhotographerListing(p, viewerForSelf) ? (
                          <p className="mt-1.5 text-[10px] leading-snug text-zinc-500">
                            To activate your public profile link, set a{' '}
                            <strong>username</strong>, add a{' '}
                            <strong>profile image</strong>, then save your
                            photography profile in settings.
                          </p>
                        ) : null}
                      </div>
                    )}
                    {canBook ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openBooking(p);
                      }}
                      className="w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                    >
                      Request booking
                    </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PhotographerPublicDetailModal
        photographer={detailPhotographer}
        open={detailPhotographer != null}
        onClose={() => setDetailPhotographer(null)}
        onRequestBooking={(p) => {
          setDetailPhotographer(null);
          openBooking(p);
        }}
        saved={detailPhotographer ? isSaved(detailPhotographer.id) : false}
        onToggleSave={() => {
          if (detailPhotographer) toggle(detailPhotographer.id);
        }}
        user={user}
        openLoginModal={() => openLoginModal()}
        canRequestBooking={
          detailPhotographer
            ? !isOwnDirectoryPhotographerListing(
                detailPhotographer,
                viewerForSelf,
              )
            : true
        }
      />

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
