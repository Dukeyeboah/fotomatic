'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  DIRECTORY_GALLERY_MAX,
  type DirectoryPhotographer,
  directoryPhotographerHeroImageUrl,
  photographerPlaceholderImagePath,
} from '@/lib/photographers-directory';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import Link from 'next/link';
import { PhotographerSocialIconButtons } from '@/components/photographer-social-icon-buttons';
import { ExternalLink, Heart, X } from 'lucide-react';

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
  return 'Location coming soon';
}

function splitPortfolioUrls(s: string | undefined): string[] {
  const t = (s ?? '').trim();
  if (!t) return [];
  return t
    .split(/\s+|,|\n/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 15);
}

function heroSrc(p: DirectoryPhotographer): string {
  const u = directoryPhotographerHeroImageUrl(p);
  if (u && /^https?:\/\//i.test(u)) return u;
  if (u && u.startsWith('/')) return u;
  return photographerPlaceholderImagePath(p.id);
}

function modalBannerSrc(p: DirectoryPhotographer): string {
  const b = p.bannerImageUrl?.trim();
  if (b && /^https?:\/\//i.test(b)) return b;
  if (b && b.startsWith('/')) return b;
  return heroSrc(p);
}

export function PhotographerPublicDetailModal({
  photographer,
  open,
  onClose,
  onRequestBooking,
  saved,
  onToggleSave,
  user,
  openLoginModal,
}: {
  photographer: DirectoryPhotographer | null;
  open: boolean;
  onClose: () => void;
  onRequestBooking: (p: DirectoryPhotographer) => void;
  saved: boolean;
  onToggleSave: () => void;
  user: User | null;
  openLoginModal: (opts?: { redirectTo?: string }) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !photographer) return null;

  const p = photographer;
  const img = modalBannerSrc(p);
  const remote = /^https?:\/\//i.test(img);
  const gallery = (p.galleryImageUrls ?? [])
    .filter(Boolean)
    .slice(0, DIRECTORY_GALLERY_MAX);
  const extras = splitPortfolioUrls(p.portfolioLinks).slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photographer-detail-title"
      >
        <div className="relative shrink-0 border-b border-zinc-100">
          <div className="relative aspect-[16/9] w-full bg-zinc-100 sm:aspect-[21/9]">
            {remote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <Image
                src={img.startsWith('/') ? img : `/${img}`}
                alt=""
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          </div>
          <button
            type="button"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-800 shadow-md ring-1 ring-zinc-900/10 hover:bg-white"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md ring-1 ring-zinc-900/10 hover:bg-white"
            title={saved ? 'Remove from saved' : 'Save photographer'}
            onClick={() => {
              if (!user) {
                openLoginModal();
                return;
              }
              onToggleSave();
            }}
          >
            <Heart
              className={`h-5 w-5 ${saved ? 'fill-red-500 text-red-500' : 'text-zinc-700'}`}
              strokeWidth={1.75}
            />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="photographer-detail-title"
                className="font-serif text-2xl font-semibold text-zinc-900"
              >
                {displayName(p)}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">{formatLocation(p)}</p>
            </div>
            <p className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-900">
              From ${p.startingHourlyRate}/hr
            </p>
          </div>

          <div className="mt-5">
            <PhotographerSocialIconButtons
              instagram={p.instagram}
              website={p.website}
              twitter={p.twitter}
              facebook={p.facebook}
              portfolioLinks={p.portfolioLinks}
            />
          </div>

          {p.profileSlug ? (
            <Link
              href={publicPhotographerProfilePath(p.profileSlug)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
            >
              View full profile
              <ExternalLink className="h-4 w-4 opacity-70" />
            </Link>
          ) : null}

          {p.bio ? (
            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Bio
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                {p.bio}
              </p>
            </section>
          ) : null}

          {p.photographyFocus ? (
            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Expertise
              </h3>
              <p className="mt-2 text-sm text-zinc-800">{p.photographyFocus}</p>
            </section>
          ) : null}

          {p.serviceArea || p.openToOtherAreas ? (
            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Coverage
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                {p.serviceArea?.trim() || '—'}
                {p.openToOtherAreas ? (
                  <span className="mt-1 block text-xs text-zinc-600">
                    Open to serving other areas.
                  </span>
                ) : null}
              </p>
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Gallery
              </h3>
              <div className="mt-3 flex gap-3 overflow-x-auto overscroll-x-contain pb-2 pt-0.5 [-webkit-overflow-scrolling:touch]">
                {gallery.map((url) => (
                  <div
                    key={url}
                    className="relative h-28 w-40 shrink-0 overflow-hidden rounded-xl bg-zinc-100"
                  >
                    {/^https?:\/\//i.test(url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={url.startsWith('/') ? url : `/${url}`}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {extras.length > 0 ? (
            <section className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Portfolio links
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm">
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
                      className="font-medium text-amber-900 underline-offset-2 hover:underline"
                    >
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <button
            type="button"
            className="mt-8 w-full rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            onClick={() => {
              if (!user) {
                openLoginModal();
                return;
              }
              onRequestBooking(p);
            }}
          >
            Request booking
          </button>
        </div>
      </div>
    </div>
  );
}
