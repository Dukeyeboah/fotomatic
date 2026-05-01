'use client';

import Image from 'next/image';
import { Heart } from 'lucide-react';
import {
  photographerPlaceholderImagePath,
  type DirectoryPhotographer,
} from '@/lib/photographers-directory';

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

function cardImage(p: DirectoryPhotographer): string {
  const u = p.photoUrl?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return photographerPlaceholderImagePath(p.id);
}

const TAGS = ['Graduation', 'Portraits', 'Events', 'Weddings'] as const;

export function DashboardPhotographerCard({
  photographer,
  saved,
  onToggleSave,
  onRequestBooking,
}: {
  photographer: DirectoryPhotographer;
  saved: boolean;
  onToggleSave: () => void;
  onRequestBooking: () => void;
}) {
  const tag = TAGS[photographer.id.length % TAGS.length]!;
  const imgSrc = cardImage(photographer);
  const remoteImg = /^https?:\/\//i.test(imgSrc);
  return (
    <div className="flex w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        {remoteImg ? (
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
            sizes="260px"
          />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-md ring-1 ring-zinc-900/10 transition-colors hover:text-red-600"
          aria-label={saved ? 'Remove from saved' : 'Save photographer'}
        >
          <Heart
            className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`}
            strokeWidth={1.75}
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold text-zinc-900">{displayName(photographer)}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{formatLocation(photographer)}</p>
        <p className="mt-2 text-sm font-semibold text-zinc-800">
          From ${photographer.startingHourlyRate}/hr
        </p>
        <p className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            {tag}
          </span>
        </p>
        <button
          type="button"
          onClick={onRequestBooking}
          className="mt-4 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Request Booking
        </button>
      </div>
    </div>
  );
}
