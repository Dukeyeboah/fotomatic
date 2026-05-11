'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DIRECTORY_GALLERY_MAX,
  type DirectoryPhotographer,
  directoryPhotographerHeroImageUrl,
  photographerPlaceholderImagePath,
} from '@/lib/photographers-directory';
import { fetchPhotographerByProfileSlug } from '@/lib/firebase/photographer-by-slug';
import {
  isReservedProfileSlug,
  isValidPublicProfileSlug,
  normalizePublicProfileSlug,
} from '@/lib/public-profile-slug';
import { PhotographerSocialIconButtons } from '@/components/photographer-social-icon-buttons';
import { Loader2, MapPin, X } from 'lucide-react';

function displayName(p: DirectoryPhotographer): string {
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
  return '';
}

function splitPortfolioUrls(s: string | undefined): string[] {
  const t = (s ?? '').trim();
  if (!t) return [];
  return t
    .split(/\s+|,|\n/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function PublicPhotographerProfileView({ handle }: { handle: string }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [p, setP] = useState<DirectoryPhotographer | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = normalizePublicProfileSlug(handle);
      if (
        !s ||
        isReservedProfileSlug(s) ||
        !isValidPublicProfileSlug(s)
      ) {
        if (!cancelled) setP(null);
        return;
      }
      const row = await fetchPhotographerByProfileSlug(s);
      if (!cancelled) setP(row);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle]);

  if (p === undefined) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Profile not found
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          This link may be wrong, or the photographer has not published their
          profile yet.
        </p>
        <Link
          href="/photographers"
          className="mt-8 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Browse photographers
        </Link>
      </div>
    );
  }

  const banner =
    p.bannerImageUrl?.trim() ||
    directoryPhotographerHeroImageUrl(p) ||
    photographerPlaceholderImagePath(p.id);
  const bannerRemote = /^https?:\/\//i.test(banner);
  const avatar =
    p.photoUrl?.trim() || directoryPhotographerHeroImageUrl(p) || '';
  const avatarRemote = avatar && /^https?:\/\//i.test(avatar);
  const loc = formatLocation(p);
  const gallery = (p.galleryImageUrls ?? [])
    .filter(Boolean)
    .slice(0, DIRECTORY_GALLERY_MAX);
  const extras = splitPortfolioUrls(p.portfolioLinks);

  return (
    <div className="pb-16">
      <div className="relative h-[min(52vw,320px)] w-full overflow-hidden bg-zinc-900 sm:h-80">
        {bannerRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <Image
            src={banner.startsWith('/') ? banner : `/${banner}`}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col items-center sm:-mt-20 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-xl ring-2 ring-zinc-200/80 sm:h-40 sm:w-40">
            {avatarRemote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : avatar ? (
              <Image
                src={avatar.startsWith('/') ? avatar : `/${avatar}`}
                alt=""
                fill
                className="object-cover"
                sizes="160px"
              />
            ) : (
              <Image
                src={photographerPlaceholderImagePath(p.id)}
                alt=""
                fill
                className="object-cover"
                sizes="160px"
              />
            )}
          </div>
          <div className="mt-4 w-full text-center sm:mt-2 sm:flex-1 sm:text-left">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              {displayName(p)}
            </h1>
            {loc ? (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-zinc-600 sm:justify-start">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                {loc}
              </p>
            ) : null}
            <p className="mt-3 text-lg font-semibold text-zinc-800">
              From ${p.startingHourlyRate}/hr
            </p>
            {p.bio ? (
              <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-zinc-700 sm:max-w-xl">
                {p.bio}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 flex justify-center sm:justify-start">
          <PhotographerSocialIconButtons
            instagram={p.instagram}
            website={p.website}
            twitter={p.twitter}
            facebook={p.facebook}
            portfolioLinks={p.portfolioLinks}
          />
        </div>

        {p.interests ? (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Interests
            </h2>
            <p className="mt-3 text-base text-zinc-800">{p.interests}</p>
          </section>
        ) : null}

        {p.photographyFocus ? (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Expertise
            </h2>
            <p className="mt-3 text-base text-zinc-800">{p.photographyFocus}</p>
          </section>
        ) : null}

        {p.serviceArea || p.openToOtherAreas ? (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Coverage
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-base text-zinc-800">
              {p.serviceArea?.trim() || '—'}
              {p.openToOtherAreas ? (
                <span className="mt-2 block text-sm text-zinc-600">
                  Open to serving other areas.
                </span>
              ) : null}
            </p>
          </section>
        ) : null}

        {(p.phoneContact && p.phone?.trim()) ||
        (p.emailContact && p.email?.trim()) ? (
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Contact
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {p.phoneContact && p.phone?.trim() ? (
                <div>
                  <dt className="text-zinc-500">Phone</dt>
                  <dd className="font-medium text-zinc-900">
                    <a href={`tel:${p.phone.replace(/\s/g, '')}`}>{p.phone}</a>
                  </dd>
                </div>
              ) : null}
              {p.emailContact && p.email?.trim() ? (
                <div>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="font-medium text-zinc-900">
                    <a href={`mailto:${p.email}`}>{p.email}</a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {extras.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Portfolio links
            </h2>
            <ul className="mt-3 space-y-2">
              {extras.map((u) => (
                <li key={u}>
                  <a
                    href={
                      u.startsWith('http')
                        ? u
                        : `https://${u.replace(/^\/\//, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-medium text-amber-900 underline-offset-2 hover:underline"
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Gallery
            </h2>
            <div className="mt-4 columns-2 gap-3 sm:columns-3">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  className="mb-3 block w-full cursor-zoom-in break-inside-avoid overflow-hidden rounded-xl bg-zinc-100 text-left ring-1 ring-zinc-200 transition hover:ring-2 hover:ring-amber-900/30"
                  onClick={() => setLightboxUrl(url)}
                >
                  {/^https?:\/\//i.test(url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt=""
                      className="w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={url.startsWith('/') ? url : `/${url}`}
                      alt=""
                      width={800}
                      height={600}
                      className="h-auto w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/photographers"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-zinc-900 px-6 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Book through Fotomatic
          </Link>
        </div>
      </div>

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          role="presentation"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm hover:bg-white/25"
            aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[min(90vh,900px)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
