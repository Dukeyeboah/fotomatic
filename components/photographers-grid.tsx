'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { bookPhotographer } from '@/lib/firebase/firestore';
import {
  type DirectoryPhotographer,
  getDirectoryPhotographers,
} from '@/lib/photographers-directory';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { MapPin, AtSign, ArrowUpRight } from 'lucide-react';

const PLACEHOLDER_IMAGES = [
  '/fotomaticImages/fotomatic1.jpg',
  '/fotomaticImages/fotomatic2.jpg',
  '/fotomaticImages/fotomatic3.jpg',
  '/fotomaticImages/fotomatic4.jpg',
];

function getPhotographerName(p: DirectoryPhotographer) {
  if (p.lastName) return `${p.firstName} ${p.lastName}`.trim();
  return p.firstName;
}

function getInitials(p: DirectoryPhotographer) {
  const n = getPhotographerName(p);
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
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
}: {
  /** Shown when a referral/discount code is active (e.g. from Grad Drive link). */
  promoLabel?: string | null;
}) {
  const list = useMemo(() => getDirectoryPhotographers(), []);
  const [q, setQ] = useState('');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();

  const filtered = list.filter((p) => {
    if (!q) return true;
    const n = getPhotographerName(p).toLowerCase();
    const loc = formatLocation(p).toLowerCase();
    const qq = q.toLowerCase();
    return n.includes(qq) || loc.includes(qq);
  });

  const book = async (p: DirectoryPhotographer) => {
    if (!user || !userData) {
      openLoginModal();
      return;
    }
    setBookingId(p.id);
    const ok = await bookPhotographer({
      photographerId: p.id,
      photographerName: getPhotographerName(p),
      userId: user.uid,
      userName: userData.displayName || user.email || 'Unknown',
      userEmail: userData.email || user.email || '',
    });
    setBookingId(null);
    if (ok) {
      alert(
        `Request sent for ${getPhotographerName(p)}. Our team will follow up.`,
      );
    } else {
      alert('Could not send booking. Try again later.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
      <div className="space-y-3 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          DIRECTORY
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-900 md:text-4xl">
          Find a photographer
        </h1>
        <p className="mx-auto max-w-lg text-zinc-600">
          Minimal profiles — image, links, and location — so you can choose
          quickly.
        </p>
        {promoLabel ? (
          <p className="inline-block rounded-full border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-sm font-medium text-amber-900">
            {promoLabel}
          </p>
        ) : null}
      </div>

      <div className="flex justify-center">
        <input
          type="search"
          placeholder="Search by name or location…"
          className="w-full max-w-md rounded-full border border-zinc-200/80 bg-[#faf8f5] px-5 py-3 text-sm shadow-sm outline-none ring-zinc-900/0 transition-shadow focus:bg-white focus:ring-2 focus:ring-amber-900/15"
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
          {filtered.map((p, i) => {
            const photo = p.photoUrl?.trim();
            const ig = p.instagram?.trim();
            const web = p.website?.trim();
            const igHref = ig ? normalizeUrl(ig, 'ig') : '';
            const webHref = web ? normalizeUrl(web, 'web') : '';

            return (
              <article
                key={p.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-[#faf8f5] shadow-sm ring-1 ring-zinc-900/5 transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/5] bg-gradient-to-br from-stone-200/80 to-stone-100">
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
                    <>
                      <Image
                        src={
                          PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]!
                        }
                        alt=""
                        fill
                        className="object-cover opacity-40 grayscale-[20%] transition-opacity group-hover:opacity-50"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/25">
                        <span className="font-serif text-3xl font-medium tracking-wide text-white drop-shadow-sm">
                          {getInitials(p)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-zinc-900">
                      {getPhotographerName(p)}
                    </h2>
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
                    {!igHref && !webHref ? (
                      <span className="text-xs text-zinc-400">
                        Links coming soon
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => book(p)}
                    disabled={bookingId === p.id}
                    className="mt-auto w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
                  >
                    {bookingId === p.id ? 'Sending…' : 'Request booking'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
