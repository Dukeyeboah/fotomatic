'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  DIRECTORY_GALLERY_MAX,
  type DirectoryPhotographer,
  directoryPhotographerHeroImageUrl,
} from '@/lib/photographers-directory';
import { fetchPhotographerByProfileSlug } from '@/lib/firebase/photographer-by-slug';
import {
  isReservedProfileSlug,
  isValidPublicProfileSlug,
  normalizePublicProfileSlug,
} from '@/lib/public-profile-slug';
import {
  hasPublicContactTabContent,
  isEmailShownOnPublicProfile,
  isPhoneShownOnPublicProfile,
} from '@/lib/public-profile-contact';
import { PhotographerSocialIconButtons } from '@/components/photographer-social-icon-buttons';
import { PublicProfileBannerShare } from '@/components/photographer/public-profile-banner-share';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import { Loader2, MapPin, X } from 'lucide-react';
import { PhotographerReviewsPanel } from '@/components/photographer-reviews-panel';
import { PhotographerFocusPricingDisplay } from '@/components/photographer-focus-pricing-display';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';
import { isDirectoryListingFallbackUrl } from '@/lib/fotomatic-marketing-images';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';

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

type InfoTab = 'bio' | 'coverage' | 'contact' | 'reviews';

export function PublicPhotographerProfileView({ handle }: { handle: string }) {
  const pathname = usePathname();
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [p, setP] = useState<DirectoryPhotographer | null | undefined>(
    undefined,
  );
  const [tab, setTab] = useState<InfoTab>('bio');

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

  const bookHref = useMemo(() => {
    if (!user || !userData) return null;
    if (userData.role === 'photographer') return '/photographer/directory';
    return '/dashboard/photographers';
  }, [user, userData]);

  const directoryHref = useMemo(() => {
    if (!user || !userData) return '/photographers';
    if (userData.role === 'photographer') return '/photographer/directory';
    if (userData.role === 'admin') return '/admin/photographers';
    return '/dashboard/photographers';
  }, [user, userData]);

  const isSelfListing = useMemo(() => {
    if (!p || !user || !userData) return false;
    return isOwnDirectoryPhotographerListing(p, {
      uid: user.uid,
      role: userData.role,
      directoryId: userData.photographer?.directoryId,
    });
  }, [p, user, userData]);

  const showBioTab = useMemo(
    () =>
      !!p &&
      (Boolean(p.bio?.trim()) ||
        Boolean(p.interests?.trim()) ||
        Boolean(p.photographyFocus?.trim()) ||
        Boolean(p.photographyFocuses?.length)),
    [p],
  );
  const showCoverageTab = useMemo(
    () => !!p && (Boolean(p.serviceArea?.trim()) || p.openToOtherAreas === true),
    [p],
  );
  const showContactTab = useMemo(
    () => !!p && hasPublicContactTabContent(p),
    [p],
  );
  const showReviewsTab = true;

  const effectiveTab = useMemo((): InfoTab => {
    if (tab === 'bio' && showBioTab) return 'bio';
    if (tab === 'coverage' && showCoverageTab) return 'coverage';
    if (tab === 'contact' && showContactTab) return 'contact';
    if (tab === 'reviews' && showReviewsTab) return 'reviews';
    if (showBioTab) return 'bio';
    if (showCoverageTab) return 'coverage';
    if (showContactTab) return 'contact';
    if (showReviewsTab) return 'reviews';
    return 'bio';
  }, [tab, showBioTab, showCoverageTab, showContactTab, showReviewsTab]);

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
          This link may be wrong, or this photographer does not have a public
          page yet. If you are the photographer, set a username and save your
          profile so your listing syncs.
        </p>
        <Link
          href="/photographer/directory"
          className="mt-8 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Browse photographers
        </Link>
      </div>
    );
  }

  const hero = directoryPhotographerHeroImageUrl(p);
  const photo = p.photoUrl?.trim() || '';
  const bannerRaw =
    p.bannerImageUrl?.trim() || hero || '';
  const bannerIsLogoFallback =
    !bannerRaw || isDirectoryListingFallbackUrl(bannerRaw);
  const banner = bannerIsLogoFallback ? null : bannerRaw;
  const bannerRemote = banner != null && /^https?:\/\//i.test(banner);
  const avatarRaw = photo || hero || '';
  const avatarIsLogoFallback =
    !avatarRaw || isDirectoryListingFallbackUrl(avatarRaw);
  const avatar = avatarIsLogoFallback ? null : avatarRaw;
  const avatarRemote = avatar != null && /^https?:\/\//i.test(avatar);
  const loc = formatLocation(p);
  const gallery = (p.galleryImageUrls ?? [])
    .filter(Boolean)
    .slice(0, DIRECTORY_GALLERY_MAX);

  const phonePublic = isPhoneShownOnPublicProfile(p);
  const emailPublic = isEmailShownOnPublicProfile(p);

  const tabBtn = (id: InfoTab, label: string, show: boolean) =>
    show ? (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={effectiveTab === id}
        onClick={() => setTab(id)}
        className={[
          'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
          effectiveTab === id
            ? 'bg-zinc-900 text-white shadow-sm'
            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
        ].join(' ')}
      >
        {label}
      </button>
    ) : null;

  return (
    <div className="pb-16">
      <div className="relative h-[min(52vw,320px)] w-full bg-zinc-900 sm:h-80">
        <div className="absolute inset-0 overflow-hidden">
          {bannerIsLogoFallback ? (
            <DirectoryListingPlaceholderImage
              alt=""
              fill
              className="object-contain bg-white p-12 sm:p-16"
              priority
              sizes="100vw"
            />
          ) : bannerRemote ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner!}
              alt=""
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <Image
              src={banner!.startsWith('/') ? banner! : `/${banner!}`}
              alt=""
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <PublicProfileBannerShare profileSlug={p.profileSlug} />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <div className="-mt-16 flex flex-col items-center sm:-mt-20 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-xl ring-2 ring-zinc-200/80 sm:h-40 sm:w-40">
            {avatarIsLogoFallback ? (
              <DirectoryListingPlaceholderImage
                alt=""
                fill
                className="object-contain bg-white p-4"
                sizes="160px"
              />
            ) : avatarRemote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar!}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={avatar!.startsWith('/') ? avatar! : `/${avatar!}`}
                alt=""
                fill
                className="object-cover"
                sizes="160px"
              />
            )}
          </div>
          <div className="mt-4 w-full sm:mt-2 sm:min-w-0 sm:flex-1">
            <div className="rounded-2xl bg-white/80 p-5 shadow-lg ring-1 ring-zinc-200/80 backdrop-blur-md sm:p-6">
              <h1 className="text-center font-serif text-3xl font-semibold tracking-tight text-zinc-900 sm:text-left sm:text-4xl">
                {displayName(p)}
              </h1>
              {loc ? (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-zinc-600 sm:justify-start">
                  <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                  {loc}
                </p>
              ) : null}
              <p className="mt-2 text-center text-sm font-bold text-zinc-800 sm:text-left">
                {formatDirectoryStartingPrice(p)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center sm:text-left">
          <Link
            href={directoryHref}
            className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
          >
            ← Back to all photographers
          </Link>
        </p>

        <div className="mt-8 flex flex-col gap-4 border-b border-zinc-200/80 pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex justify-center sm:justify-start">
            <PhotographerSocialIconButtons
              instagram={p.instagram}
              website={p.website}
              twitter={p.twitter}
              facebook={p.facebook}
              portfolioLinks={p.portfolioLinks}
            />
          </div>
          {showBioTab || showCoverageTab || showContactTab || showReviewsTab ? (
            <div
              className="flex flex-wrap justify-center gap-2 sm:justify-end"
              role="tablist"
              aria-label="Profile sections"
            >
              {tabBtn('bio', 'Bio', showBioTab)}
              {tabBtn('coverage', 'Coverage', showCoverageTab)}
              {tabBtn('contact', 'Contact', showContactTab)}
              {tabBtn('reviews', 'Reviews', showReviewsTab)}
            </div>
          ) : null}
        </div>

        {showBioTab || showCoverageTab || showContactTab || showReviewsTab ? (
          <section
            className="mt-6 rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6"
            role="tabpanel"
          >
            {effectiveTab === 'bio' && showBioTab ? (
              <div className="space-y-4 text-sm leading-relaxed text-zinc-800">
                {p.bio?.trim() ? (
                  <p className="whitespace-pre-wrap text-base">{p.bio}</p>
                ) : null}
                <PhotographerFocusPricingDisplay photographer={p} />
                {p.interests?.trim() ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Interests
                    </h3>
                    <p className="mt-1">{p.interests}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            {effectiveTab === 'coverage' && showCoverageTab ? (
              <div className="text-sm text-zinc-800">
                <p className="whitespace-pre-wrap text-base">
                  {p.serviceArea?.trim() || '—'}
                </p>
                {p.openToOtherAreas ? (
                  <p className="mt-3 text-sm text-zinc-600">
                    Open to serving other areas.
                  </p>
                ) : null}
              </div>
            ) : null}
            {effectiveTab === 'contact' && showContactTab ? (
              <div className="text-sm">
                {phonePublic || emailPublic ? (
                  <dl className="space-y-3">
                    {phonePublic && p.phone?.trim() ? (
                      <div>
                        <dt className="text-zinc-500">Phone</dt>
                        <dd className="font-medium text-zinc-900">
                          <a href={`tel:${p.phone!.replace(/\s/g, '')}`}>
                            {p.phone}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {emailPublic && p.email?.trim() ? (
                      <div>
                        <dt className="text-zinc-500">Email</dt>
                        <dd className="font-medium text-zinc-900">
                          <a href={`mailto:${p.email}`}>{p.email}</a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-zinc-600">
                    This photographer has chosen not to display phone or email
                    on their public page. Reach out through Fotomatic booking when
                    available.
                  </p>
                )}
              </div>
            ) : null}
            {effectiveTab === 'reviews' && showReviewsTab ? (
              <PhotographerReviewsPanel
                photographerDirectoryId={p.id}
                photographerDisplayName={displayName(p)}
                viewer={user}
                viewerDisplayName={
                  userData?.displayName?.trim() ||
                  userData?.username?.trim() ||
                  null
                }
                isSelf={isSelfListing}
                onNeedLogin={() =>
                  openLoginModal({
                    redirectTo: pathname || undefined,
                    introTitle: 'Sign in to leave a review',
                    introMessage:
                      'Log in to rate this photographer and share optional feedback.',
                  })
                }
              />
            ) : null}
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

        {!isSelfListing ? (
          <div className="mt-12">
            {!user ? (
              <button
                type="button"
                onClick={() =>
                  openLoginModal({
                    redirectTo: pathname || undefined,
                    introTitle: 'Sign in to book on Fotomatic',
                    introMessage:
                      'Create an account or log in to send booking requests and message photographers.',
                  })
                }
                className="w-full rounded-xl bg-zinc-900 px-6 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Book through Fotomatic
              </button>
            ) : bookHref ? (
              <Link
                href={bookHref}
                className="flex w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-3.5 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Request booking
              </Link>
            ) : null}
          </div>
        ) : null}
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
