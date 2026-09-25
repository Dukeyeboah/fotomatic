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
import {
  MapPin,
  Heart,
  Search,
  Eye,
  CalendarPlus,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
} from 'lucide-react';
import { PhotographerSocialIconButtons } from '@/components/photographer-social-icon-buttons';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { CannotFavoriteSelfDialog } from '@/components/cannot-favorite-self-dialog';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { usePhotographerDirectoryReviewStats } from '@/lib/hooks/use-directory-review-stats';
import { StarRow } from '@/components/photographer-reviews-panel';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';
import {
  PHOTOGRAPHY_FOCUS_OPTIONS,
  parsePhotographyFocusesFromFirestore,
} from '@/lib/photography-focus';

type SortMode =
  | 'featured'
  | 'rating'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc';

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

function startingPriceValue(p: DirectoryPhotographer): number {
  const n =
    typeof p.startingPrice === 'number'
      ? p.startingPrice
      : typeof p.startingHourlyRate === 'number'
        ? p.startingHourlyRate
        : Number.POSITIVE_INFINITY;
  return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY;
}

function DirectoryHeroImage({
  photo,
  photographerId,
}: {
  photo: string | undefined;
  photographerId: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) {
    return (
      <DirectoryListingPlaceholderImage
        alt=""
        fill
        className="object-contain bg-white p-8 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    );
  }
  if (/^https?:\/\//i.test(photo)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote photographer URLs
      <img
        key={`${photographerId}-${photo}`}
        src={photo}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <Image
      src={photo.startsWith('/') ? photo : `/${photo}`}
      alt=""
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 33vw"
      onError={() => setFailed(true)}
    />
  );
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
  const [sort, setSort] = useState<SortMode>('featured');
  const [specialty, setSpecialty] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bookingPhotographer, setBookingPhotographer] =
    useState<DirectoryPhotographer | null>(null);
  const [detailPhotographer, setDetailPhotographer] =
    useState<DirectoryPhotographer | null>(null);
  const [selfFavoriteOpen, setSelfFavoriteOpen] = useState(false);
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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const specialtyKey = specialty.trim().toLowerCase();
    let rows = list.filter((p) => {
      const focuses = parsePhotographyFocusesFromFirestore({
        photographyFocuses: p.photographyFocuses,
        photographyFocus: p.photographyFocus,
      });
      if (
        specialtyKey &&
        !focuses.some((f) => f.toLowerCase() === specialtyKey)
      ) {
        return false;
      }
      if (!qq) return true;
      const n = getPhotographerName(p).toLowerCase();
      const loc = formatLocation(p).toLowerCase();
      const focus = focuses.join(' ').toLowerCase();
      return n.includes(qq) || loc.includes(qq) || focus.includes(qq);
    });

    if (sort === 'featured') return rows;

    rows = [...rows];
    rows.sort((a, b) => {
      if (sort === 'rating') {
        const ra = reviewStats.get(a.id)?.average ?? -1;
        const rb = reviewStats.get(b.id)?.average ?? -1;
        if (rb !== ra) return rb - ra;
        const ca = reviewStats.get(a.id)?.count ?? 0;
        const cb = reviewStats.get(b.id)?.count ?? 0;
        return cb - ca;
      }
      if (sort === 'name-asc' || sort === 'name-desc') {
        const cmp = getPhotographerName(a).localeCompare(
          getPhotographerName(b),
          undefined,
          { sensitivity: 'base' },
        );
        return sort === 'name-asc' ? cmp : -cmp;
      }
      if (sort === 'price-asc' || sort === 'price-desc') {
        const cmp = startingPriceValue(a) - startingPriceValue(b);
        return sort === 'price-asc' ? cmp : -cmp;
      }
      return 0;
    });
    return rows;
  }, [list, q, sort, specialty, reviewStats]);

  const tryToggleFavorite = (p: DirectoryPhotographer) => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (isOwnDirectoryPhotographerListing(p, viewerForSelf)) {
      setSelfFavoriteOpen(true);
      return;
    }
    toggle(p.id);
  };

  const openBooking = (p: DirectoryPhotographer) => {
    if (!user) {
      openLoginModal();
      return;
    }
    setBookingPhotographer(p);
  };

  const embedded = variant === 'embedded';
  const nameSortActive = sort === 'name-asc' || sort === 'name-desc';
  const nameSortDesc = sort === 'name-desc';
  const priceSortActive = sort === 'price-asc' || sort === 'price-desc';
  const priceSortDesc = sort === 'price-desc';

  return (
    <div
      className={[
        'mx-auto max-w-6xl',
        embedded ? 'px-4 pb-6 sm:px-6 lg:px-8' : 'px-4 py-14 sm:px-6 lg:px-8',
      ].join(' ')}
    >
      <div
        className={[
          'sticky z-20 border-b border-zinc-200/70 bg-[#f4f1ec]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#f4f1ec]/90',
          embedded
            ? 'top-14 -mx-4 px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8'
            : 'top-0 -mx-4 px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        ].join(' ')}
      >
        {promoLabel ? (
          <p className="mb-3 text-center">
            <span className="inline-block rounded-full border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm font-medium text-amber-900">
              {promoLabel}
            </span>
          </p>
        ) : null}

        <div className="mx-auto flex max-w-xl items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Search by name, location, or specialty…"
              aria-label="Search photographers"
              className="w-full rounded-full border border-zinc-200/80 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none transition-shadow focus:ring-2 focus:ring-zinc-900/10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
            aria-expanded={filtersOpen}
            title={filtersOpen ? 'Hide filters' : 'Show filters'}
            className={[
              'inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors',
              filtersOpen || sort !== 'featured' || specialty
                ? 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800'
                : 'border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900',
            ].join(' ')}
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {filtersOpen ? (
          <div
            className="mt-3 space-y-2"
            role="group"
            aria-label="Sort and filter photographers"
          >
            <div className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto sm:gap-2">
              {(
                [
                  { id: 'featured' as const, label: 'Featured' },
                  { id: 'rating' as const, label: 'Top rated' },
                ] as const
              ).map((opt) => {
                const active = sort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSort(opt.id)}
                    className={[
                      'shrink-0 cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3.5',
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setSort(sort === 'name-asc' ? 'name-desc' : 'name-asc')
                }
                aria-label={
                  nameSortDesc
                    ? 'Sort Z to A (click to reverse)'
                    : 'Sort A to Z (click to reverse)'
                }
                title={nameSortDesc ? 'Z–A' : 'A–Z'}
                className={[
                  'inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3.5',
                  nameSortActive
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
                ].join(' ')}
              >
                A–Z
                {nameSortDesc ? (
                  <ArrowUp className="h-3 w-3" strokeWidth={2.25} />
                ) : (
                  <ArrowDown className="h-3 w-3" strokeWidth={2.25} />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSort(sort === 'price-asc' ? 'price-desc' : 'price-asc')
                }
                aria-label={
                  priceSortDesc
                    ? 'Sort price high to low (click to reverse)'
                    : 'Sort price low to high (click to reverse)'
                }
                title={
                  priceSortDesc ? 'Price high to low' : 'Price low to high'
                }
                className={[
                  'inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3.5',
                  priceSortActive
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
                ].join(' ')}
              >
                Price
                {priceSortDesc ? (
                  <ArrowUp className="h-3 w-3" strokeWidth={2.25} />
                ) : (
                  <ArrowDown className="h-3 w-3" strokeWidth={2.25} />
                )}
              </button>
            </div>
            <div className="flex justify-center">
              <label
                className={[
                  'relative inline-flex cursor-pointer items-center rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  specialty
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
                ].join(' ')}
              >
                <span className="sr-only">Filter by specialty</span>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className={[
                    'cursor-pointer appearance-none bg-transparent py-0 pr-4 outline-none',
                    specialty ? 'text-white' : 'text-inherit',
                  ].join(' ')}
                >
                  <option value="">All specialties</option>
                  {PHOTOGRAPHY_FOCUS_OPTIONS.filter((o) => o !== 'Other').map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ),
                  )}
                </select>
                <ChevronDown
                  className={[
                    'pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2',
                    specialty ? 'text-white/80' : 'text-zinc-500',
                  ].join(' ')}
                  strokeWidth={2}
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

      <div className={embedded ? 'mt-4' : 'mt-5'}>
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No photographers found.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const photo = directoryPhotographerHeroImageUrl(p);
            const canBook = !isOwnDirectoryPhotographerListing(p, viewerForSelf);
            const badges = parsePhotographyFocusesFromFirestore({
              photographyFocuses: p.photographyFocuses,
              photographyFocus: p.photographyFocus,
            }).slice(0, 2);
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
                <div className="relative aspect-[5/4] bg-gradient-to-br from-stone-200/80 to-stone-100">
                  <button
                    type="button"
                    title={
                      isSaved(p.id)
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      tryToggleFavorite(p);
                    }}
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-zinc-900 ring-1 ring-zinc-900/10 transition-colors hover:bg-white hover:text-red-600"
                  >
                    <Heart
                      className={`h-4 w-4 transition-colors ${isSaved(p.id) ? 'fill-red-500 text-red-500' : 'text-zinc-700'}`}
                      strokeWidth={1.75}
                    />
                  </button>
                  <DirectoryHeroImage photo={photo} photographerId={p.id} />
                  {badges.length > 0 ? (
                    <div className="absolute bottom-3 left-3 z-10 flex max-w-[85%] flex-wrap gap-1.5">
                      {badges.map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-serif text-base font-semibold text-zinc-900 sm:text-lg">
                        {getPhotographerName(p)}
                      </h2>
                      <span className="shrink-0 rounded-full border border-zinc-200/80 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800">
                        {formatStartingRate(p)}
                      </span>
                    </div>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-zinc-600">
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
                    className="mt-auto flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                        <span className="text-xs text-zinc-400">Links soon</span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {p.profileSlug ? (
                        <Link
                          href={publicPhotographerProfilePath(p.profileSlug)}
                          title="View profile"
                          aria-label={`View ${getPhotographerName(p)} profile`}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.75} />
                        </Link>
                      ) : null}
                      {canBook ? (
                        <button
                          type="button"
                          title="Request booking"
                          aria-label={`Request booking with ${getPhotographerName(p)}`}
                          onClick={() => openBooking(p)}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-800"
                        >
                          <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>

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
          if (detailPhotographer) tryToggleFavorite(detailPhotographer);
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

      <CannotFavoriteSelfDialog
        open={selfFavoriteOpen}
        onClose={() => setSelfFavoriteOpen(false)}
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
