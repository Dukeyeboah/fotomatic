'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CalendarPlus, Eye, Heart } from 'lucide-react';
import {
  directoryPhotographerHeroImageUrl,
  type DirectoryPhotographer,
} from '@/lib/photographers-directory';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';
import { StarRow } from '@/components/photographer-reviews-panel';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';
import { useAuth } from '@/contexts/AuthContext';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { CannotFavoriteSelfDialog } from '@/components/cannot-favorite-self-dialog';

function displayName(p: DirectoryPhotographer): string {
  if (p.lastName) return `${p.firstName} ${p.lastName}`.trim();
  return p.firstName;
}

function formatLocation(p: DirectoryPhotographer): string {
  const city = p.city?.trim();
  const state = p.state?.trim();
  const country = p.country?.trim();
  if (city && state && country) return `${city}, ${state}`;
  if (city && state) return `${city}, ${state}`;
  if (state && country) return `${state} · ${country}`;
  if (state) return `${state}, United States`;
  if (city) return city;
  return 'Location TBD';
}

function cardImage(p: DirectoryPhotographer): string | null {
  const u = directoryPhotographerHeroImageUrl(p);
  if (u && /^https?:\/\//i.test(u)) return u;
  if (u && u.startsWith('/')) return u;
  return null;
}

function focusBadges(p: DirectoryPhotographer): string[] {
  return parsePhotographyFocusesFromFirestore({
    photographyFocuses: p.photographyFocuses,
    photographyFocus: p.photographyFocus,
  }).slice(0, 2);
}

export function DashboardPhotographerCard({
  photographer,
  saved,
  onToggleSave,
  onRequestBooking,
  onOpenDetail,
  showRequestBooking = true,
  reviewSummary,
}: {
  photographer: DirectoryPhotographer;
  saved: boolean;
  onToggleSave: () => void;
  onRequestBooking: () => void;
  onOpenDetail?: () => void;
  showRequestBooking?: boolean;
  reviewSummary?: { average: number; count: number };
}) {
  const { user, userData } = useAuth();
  const [selfFavoriteOpen, setSelfFavoriteOpen] = useState(false);
  const badges = focusBadges(photographer);
  const imgSrc = cardImage(photographer);
  const remoteImg = imgSrc != null && /^https?:\/\//i.test(imgSrc);
  const profileHref = photographer.profileSlug
    ? publicPhotographerProfilePath(photographer.profileSlug)
    : null;
  const isOwn = isOwnDirectoryPhotographerListing(photographer, {
    uid: user?.uid,
    role: userData?.role,
    directoryId: userData?.photographer?.directoryId,
  });

  return (
    <div
      className={[
        'flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm sm:w-[320px]',
        onOpenDetail ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={(e) => {
        if (!onOpenDetail) return;
        if ((e.target as HTMLElement).closest('button, a')) return;
        onOpenDetail();
      }}
      onKeyDown={(e) => {
        if (!onOpenDetail) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if ((e.target as HTMLElement).closest('button, a')) return;
        e.preventDefault();
        onOpenDetail();
      }}
      role={onOpenDetail ? 'button' : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
    >
      <div className="relative aspect-[5/4] w-full bg-zinc-100">
        {!imgSrc ? (
          <DirectoryListingPlaceholderImage
            alt=""
            fill
            className="object-contain bg-white p-8"
            sizes="320px"
          />
        ) : remoteImg ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote profile URLs
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={imgSrc}
            alt=""
            fill
            className="object-cover"
            sizes="320px"
          />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isOwn) {
              setSelfFavoriteOpen(true);
              return;
            }
            onToggleSave();
          }}
          className="absolute right-2 top-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-md ring-1 ring-zinc-900/10 transition-colors hover:bg-white hover:text-red-600"
          aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : ''}`}
            strokeWidth={1.75}
          />
        </button>
        {badges.length > 0 ? (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex max-w-[85%] flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
              >
                {b}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold text-zinc-900">{displayName(photographer)}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{formatLocation(photographer)}</p>
        {reviewSummary && reviewSummary.count > 0 ? (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-zinc-600">
            <StarRow value={reviewSummary.average} size="sm" />
            <span>
              {reviewSummary.average.toFixed(1)} · {reviewSummary.count} review
              {reviewSummary.count === 1 ? '' : 's'}
            </span>
          </p>
        ) : null}

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-800">
              {formatDirectoryStartingPrice(photographer)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={(e) => e.stopPropagation()}
                aria-label={`View ${displayName(photographer)} profile`}
                title="View profile"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            ) : onOpenDetail ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail();
                }}
                aria-label={`View ${displayName(photographer)} profile`}
                title="View profile"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <Eye className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : null}
            {showRequestBooking ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestBooking();
                }}
                aria-label={`Request booking with ${displayName(photographer)}`}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-white shadow-sm transition-colors hover:bg-zinc-800"
              >
                <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <CannotFavoriteSelfDialog
        open={selfFavoriteOpen}
        onClose={() => setSelfFavoriteOpen(false)}
      />
    </div>
  );
}
