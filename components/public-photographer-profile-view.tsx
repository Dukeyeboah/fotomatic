'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
import { ProfileShareDropdown } from '@/components/photographer/profile-share-dropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import {
  Globe2,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import { PhotographerReviewsPanel } from '@/components/photographer-reviews-panel';
import { PhotographerFocusPricingDisplay } from '@/components/photographer-focus-pricing-display';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';
import { isDirectoryListingFallbackUrl } from '@/lib/fotomatic-marketing-images';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';

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

type InfoTab =
  | 'gallery'
  | 'bio'
  | 'pricing'
  | 'preferences'
  | 'contact'
  | 'reviews';

export function PublicPhotographerProfileView({
  handle,
  photographer: photographerProp,
  headerActions,
  toolbarLeft,
  bannerOverlay,
  hideBackLink = false,
  hideBookingCta = false,
  hideShare = false,
  compactChrome = false,
}: {
  /** Public slug — used when `photographer` is not passed. */
  handle?: string;
  /** Prefetched / local listing (e.g. own profile preview). */
  photographer?: DirectoryPhotographer | null;
  /** Optional actions on the right of the toolbar (e.g. Edit). */
  headerActions?: ReactNode;
  /** Optional left toolbar content when back link is hidden (e.g. View public page). */
  toolbarLeft?: ReactNode;
  /** Layered over the banner (e.g. Edit profile). */
  bannerOverlay?: ReactNode;
  hideBackLink?: boolean;
  hideBookingCta?: boolean;
  hideShare?: boolean;
  /** Tighter vertical spacing under the banner (own-profile preview). */
  compactChrome?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [fetched, setFetched] = useState<DirectoryPhotographer | null | undefined>(
    photographerProp !== undefined ? photographerProp : undefined,
  );
  const [tab, setTab] = useState<InfoTab>('gallery');

  const usingProp = photographerProp !== undefined;

  useEffect(() => {
    if (usingProp) {
      setFetched(photographerProp ?? null);
      return;
    }
    let cancelled = false;
    (async () => {
      const s = normalizePublicProfileSlug(handle ?? '');
      if (!s || isReservedProfileSlug(s) || !isValidPublicProfileSlug(s)) {
        if (!cancelled) setFetched(null);
        return;
      }
      const row = await fetchPhotographerByProfileSlug(s);
      if (!cancelled) setFetched(row);
    })();
    return () => {
      cancelled = true;
    };
  }, [handle, usingProp, photographerProp]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  const p = fetched;

  const bookHref = useMemo(() => {
    if (!user || !userData) return null;
    if (userData.role === 'photographer') return '/photographer/directory';
    return '/photographers';
  }, [user, userData]);

  const isSelfListing = useMemo(() => {
    if (!p || !user || !userData) return false;
    return isOwnDirectoryPhotographerListing(p, {
      uid: user.uid,
      role: userData.role,
      directoryId: userData.photographer?.directoryId,
    });
  }, [p, user, userData]);

  const focuses = useMemo(
    () =>
      p
        ? parsePhotographyFocusesFromFirestore({
            photographyFocuses: p.photographyFocuses,
            photographyFocus: p.photographyFocus,
          })
        : [],
    [p],
  );

  const gallery = useMemo(
    () =>
      (p?.galleryImageUrls ?? [])
        .filter(Boolean)
        .slice(0, DIRECTORY_GALLERY_MAX),
    [p],
  );

  const showBio = Boolean(p?.bio?.trim());
  const showPricing =
    !!p &&
    (focuses.length > 0 ||
      Boolean(p.pricingNotes?.trim()) ||
      typeof p.startingPrice === 'number');
  const showPreferences =
    !!p &&
    (Boolean(p.serviceArea?.trim()) ||
      p.openToOtherAreas === true ||
      Boolean(p.interests?.trim()));
  const showContact = !!p && hasPublicContactTabContent(p);

  const tabs: { id: InfoTab; label: string; show: boolean }[] = [
    { id: 'gallery', label: 'Gallery', show: true },
    { id: 'bio', label: 'Bio', show: showBio },
    { id: 'pricing', label: 'Pricing', show: showPricing },
    { id: 'preferences', label: 'Preferences', show: showPreferences },
    { id: 'contact', label: 'Contact', show: showContact },
    { id: 'reviews', label: 'Reviews', show: true },
  ];

  const effectiveTab = useMemo((): InfoTab => {
    const visible = tabs.filter((t) => t.show).map((t) => t.id);
    if (visible.includes(tab)) return tab;
    return 'gallery';
  }, [tab, showBio, showPricing, showPreferences, showContact]);

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
          href="/photographers"
          className="mt-8 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Browse photographers
        </Link>
      </div>
    );
  }

  const hero = directoryPhotographerHeroImageUrl(p);
  const photo = p.photoUrl?.trim() || '';
  const bannerRaw = p.bannerImageUrl?.trim() || hero || '';
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

  const phonePublic = isPhoneShownOnPublicProfile(p);
  const emailPublic = isEmailShownOnPublicProfile(p);

  return (
    <div className="pb-20">
      <div className="relative h-[min(42vw,260px)] w-full bg-zinc-900 sm:h-[280px]">
        <div className="absolute inset-0 overflow-hidden">
          {bannerIsLogoFallback ? (
            <DirectoryListingPlaceholderImage
              alt=""
              fill
              className="object-contain bg-white p-12 sm:p-20"
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
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
        </div>

        {bannerOverlay ? (
          <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-5">
            {bannerOverlay}
          </div>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-4 sm:px-6 sm:pb-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/95 bg-zinc-100 shadow-2xl sm:h-28 sm:w-28">
              {avatarIsLogoFallback ? (
                <DirectoryListingPlaceholderImage
                  alt=""
                  fill
                  className="object-contain bg-white p-4"
                  sizes="112px"
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
                  sizes="112px"
                />
              )}
            </div>
            <div className="w-full min-w-0 rounded-2xl bg-black/45 px-4 py-3 text-center shadow-lg backdrop-blur-md sm:w-[min(100%,28rem)] sm:px-5 sm:py-3.5 sm:text-left lg:w-[25rem]">
              <h1 className="font-serif text-2xl font-medium tracking-tight text-white sm:text-3xl">
                {displayName(p)}
              </h1>
              {loc ? (
                <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-white/90 sm:justify-start">
                  <MapPin className="h-4 w-4 shrink-0 opacity-80" />
                  {loc}
                </p>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 sm:justify-start">
                <p className="text-base font-semibold text-amber-100 sm:text-lg">
                  {formatDirectoryStartingPrice(p)}
                </p>
                {focuses.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white"
                  >
                    {f}
                  </span>
                ))}
                {focuses.length > 4 ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] text-white/85">
                    +{focuses.length - 4}
                  </span>
                ) : null}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <PhotographerSocialIconButtons
                  instagram={p.instagram}
                  website={p.website}
                  twitter={p.twitter}
                  facebook={p.facebook}
                  portfolioLinks={p.portfolioLinks}
                  size="sm"
                />
                {!hideShare ? (
                  <ProfileShareDropdown
                    profileSlug={p.profileSlug}
                    placement="below"
                    tone="onDark"
                    iconOnly
                    menuZClass="z-[100]"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div
          className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${
            compactChrome ? 'mt-3' : 'mt-4'
          }`}
        >
          <div className="shrink-0">
            {!hideBackLink ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="cursor-pointer text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
              >
                ← Back
              </button>
            ) : (
              toolbarLeft
            )}
          </div>

          <div
            className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1"
            role="tablist"
            aria-label="Profile sections"
          >
            {tabs
              .filter((t) => t.show)
              .map((t) => {
                const active = effectiveTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`cursor-pointer bg-transparent px-0 py-1.5 text-sm transition-colors ${
                      active
                        ? 'border-b-2 border-zinc-900 font-bold text-zinc-900'
                        : 'border-b-2 border-transparent font-normal text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
          </div>

          {headerActions ? (
            <div className="shrink-0">{headerActions}</div>
          ) : null}
        </div>

        <section
          className={compactChrome ? 'mt-4' : 'mt-6'}
          role="tabpanel"
        >
          {effectiveTab === 'gallery' ? (
            <div>
              {gallery.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-500">
                  No gallery photos yet.
                </p>
              ) : (
                <div className="relative left-1/2 w-[min(100vw-1.5rem,72rem)] -translate-x-1/2 sm:w-[min(100vw-3rem,72rem)]">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
                    {gallery.map((url) => (
                      <button
                        key={url}
                        type="button"
                        className="group aspect-square cursor-pointer overflow-hidden rounded-2xl bg-zinc-100"
                        onClick={() => setLightboxUrl(url)}
                      >
                        {/^https?:\/\//i.test(url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <Image
                            src={url.startsWith('/') ? url : `/${url}`}
                            alt=""
                            width={900}
                            height={900}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {effectiveTab === 'bio' && showBio ? (
            <div className="mx-auto max-w-3xl">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-700">
                {p.bio}
              </p>
            </div>
          ) : null}

          {effectiveTab === 'pricing' && showPricing ? (
            <PhotographerFocusPricingDisplay
              photographer={p}
              expandAll
              hideTitle
            />
          ) : null}

          {effectiveTab === 'preferences' && showPreferences ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {p.serviceArea?.trim() ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Service area
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-zinc-900">
                    {p.serviceArea}
                  </p>
                </div>
              ) : null}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Travel
                  </span>
                </div>
                <p className="mt-3 text-base text-zinc-900">
                  {p.openToOtherAreas
                    ? 'Open to working outside their primary area'
                    : 'Primarily serves their listed area'}
                </p>
              </div>
              {p.interests?.trim() ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:col-span-2">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Interests
                    </span>
                  </div>
                  <p className="mt-3 text-base leading-relaxed text-zinc-900">
                    {p.interests}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {effectiveTab === 'contact' && showContact ? (
            <div>
              {phonePublic || emailPublic ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {phonePublic && p.phone?.trim() ? (
                    <a
                      href={`tel:${p.phone!.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Phone
                        </p>
                        <p className="mt-0.5 font-medium text-zinc-900">
                          {p.phone}
                        </p>
                      </div>
                    </a>
                  ) : null}
                  {emailPublic && p.email?.trim() ? (
                    <a
                      href={`mailto:${p.email}`}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Email
                        </p>
                        <p className="mt-0.5 font-medium text-zinc-900">
                          {p.email}
                        </p>
                      </div>
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  This photographer has chosen not to display phone or email on
                  their public page. Reach out through Fotomatic booking when
                  available.
                </p>
              )}
            </div>
          ) : null}

          {effectiveTab === 'reviews' ? (
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

        {!hideBookingCta && !isSelfListing ? (
          <div className="mt-10 flex justify-center">
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
                className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Book through Fotomatic
              </button>
            ) : bookHref ? (
              <Link
                href={bookHref}
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
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
            className="max-h-[min(92vh,960px)] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
