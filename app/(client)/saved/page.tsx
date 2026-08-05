'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { Heart } from 'lucide-react';
import {
  directoryPhotographerHeroImageUrl,
  photographerPlaceholderImagePath,
  type DirectoryPhotographer,
} from '@/lib/photographers-directory';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';

function SavedCardImage({ photographer }: { photographer: DirectoryPhotographer }) {
  const hero = directoryPhotographerHeroImageUrl(photographer);
  const remote = hero && /^https?:\/\//i.test(hero) ? hero : null;
  const local =
    hero && hero.startsWith('/')
      ? hero
      : photographerPlaceholderImagePath(photographer.id);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <DirectoryListingPlaceholderImage
        alt=""
        fill
        className="object-contain bg-white p-4"
        sizes="112px"
      />
    );
  }

  if (remote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={remote}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={local}
      alt=""
      fill
      className="object-cover"
      sizes="112px"
      onError={() => setFailed(true)}
    />
  );
}

export default function DashboardSavedPage() {
  const directory = useMergedDirectoryPhotographers();
  const { savedIds, toggle } = useSavedPhotographerIds();
  const saved = useMemo(
    () => directory.filter((p) => savedIds.includes(p.id)),
    [directory, savedIds],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Saved photographers
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Hearts you add on Home or in the directory are stored on this device.
      </p>

      {saved.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center">
          <p className="text-zinc-600">
            No saved photographers yet.{' '}
            <Link
              href="/photographers"
              className="font-semibold text-amber-900 underline"
            >
              Browse the directory
            </Link>{' '}
            or use the hearts on Home.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => (
            <li
              key={p.id}
              className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="relative h-28 w-28 shrink-0 bg-zinc-100">
                <SavedCardImage photographer={p} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                <p className="font-semibold text-zinc-900">
                  {p.lastName ? `${p.firstName} ${p.lastName}` : p.firstName}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDirectoryStartingPrice(p)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/photographers"
                    className="text-xs font-semibold text-amber-900 underline"
                  >
                    View in directory
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-red-600"
                  >
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    Unsave
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
