'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  DIRECTORY_GALLERY_MAX,
  type DirectoryPhotographer,
  directoryPhotographerHeroImageUrl,
} from '@/lib/photographers-directory';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import Link from 'next/link';
import { PhotographerSocialIconButtons } from '@/components/photographer-social-icon-buttons';
import { ProfileShareDropdown } from '@/components/photographer/profile-share-dropdown';
import {
  ExternalLink,
  Globe2,
  Heart,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PhotographerReviewsPanel } from '@/components/photographer-reviews-panel';
import { isDirectoryListingFallbackUrl } from '@/lib/fotomatic-marketing-images';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';
import { formatDirectoryStartingPrice } from '@/lib/photographer-pricing';
import { PhotographerFocusPricingDisplay } from '@/components/photographer-focus-pricing-display';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';
import {
  hasPublicContactTabContent,
  isEmailShownOnPublicProfile,
  isPhoneShownOnPublicProfile,
} from '@/lib/public-profile-contact';
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
  if (city && state && country) return `${city}, ${state} · ${country}`;
  if (city && state) return `${city}, ${state}`;
  if (state && country) return `${state} · ${country}`;
  if (state) return `${state}, United States`;
  if (city) return city;
  return 'Location coming soon';
}

function heroSrc(p: DirectoryPhotographer): string | null {
  const u = directoryPhotographerHeroImageUrl(p);
  if (u && /^https?:\/\//i.test(u)) return u;
  if (u && u.startsWith('/')) return u;
  return null;
}

function modalBannerSrc(p: DirectoryPhotographer): string | null {
  const b = p.bannerImageUrl?.trim();
  if (b && /^https?:\/\//i.test(b)) return b;
  if (b && b.startsWith('/')) return b;
  return heroSrc(p);
}

type InfoTab =
  | 'gallery'
  | 'bio'
  | 'pricing'
  | 'preferences'
  | 'contact'
  | 'reviews';

export function PhotographerPublicDetailModal({
  photographer,
  open,
  onClose,
  onRequestBooking,
  saved,
  onToggleSave,
  user,
  openLoginModal,
  canRequestBooking = true,
}: {
  photographer: DirectoryPhotographer | null;
  open: boolean;
  onClose: () => void;
  onRequestBooking: (p: DirectoryPhotographer) => void;
  saved: boolean;
  onToggleSave: () => void;
  user: User | null;
  openLoginModal: (opts?: { redirectTo?: string }) => void;
  /** When false, hides the primary booking CTA (e.g. photographer viewing their own listing). */
  canRequestBooking?: boolean;
}) {
  const { userData } = useAuth();
  const [tab, setTab] = useState<InfoTab>('gallery');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selfFavoriteOpen, setSelfFavoriteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('gallery');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxUrl) setLightboxUrl(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, lightboxUrl]);

  const p = photographer;

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

  if (!open || !p) return null;

  const img = modalBannerSrc(p);
  const useLogoPlaceholder =
    img == null || (img != null && isDirectoryListingFallbackUrl(img));
  const remote = img != null && /^https?:\/\//i.test(img);
  const heroIsLogoFallback = useLogoPlaceholder;
  const avatarRaw = p.photoUrl?.trim() || null;
  const avatarIsLogoFallback =
    !avatarRaw || isDirectoryListingFallbackUrl(avatarRaw);
  const avatar = avatarIsLogoFallback ? null : avatarRaw;
  const avatarRemote = avatar != null && /^https?:\/\//i.test(avatar);
  const phonePublic = isPhoneShownOnPublicProfile(p);
  const emailPublic = isEmailShownOnPublicProfile(p);
  const loc = formatLocation(p);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-[min(92vh,860px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photographer-detail-title"
      >
        {/* Banner + identity card straddling the bottom edge (~2/3 over, ~1/3 below) */}
        <div className="relative shrink-0">
          <div className="relative h-[150px] w-full bg-zinc-900 sm:h-[168px]">
            <div className="absolute inset-0 overflow-hidden">
              {heroIsLogoFallback ? (
                <DirectoryListingPlaceholderImage
                  alt=""
                  fill
                  className="object-contain bg-white p-10 sm:p-14"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
              ) : remote ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img!}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              ) : (
                <Image
                  src={img!.startsWith('/') ? img! : `/${img!}`}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
            </div>

            <button
              type="button"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-zinc-800 shadow-md ring-1 ring-zinc-900/10 transition-colors hover:bg-white hover:text-zinc-950"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute left-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-zinc-900 shadow-md ring-1 ring-zinc-900/10 transition-colors hover:bg-white hover:text-red-600"
              title={saved ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => {
                if (!user) {
                  openLoginModal();
                  return;
                }
                if (
                  isOwnDirectoryPhotographerListing(p, {
                    uid: user.uid,
                    role: userData?.role,
                    directoryId: userData?.photographer?.directoryId,
                  })
                ) {
                  setSelfFavoriteOpen(true);
                  return;
                }
                onToggleSave();
              }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-zinc-700'}`}
                strokeWidth={1.75}
              />
            </button>

            <div className="absolute inset-x-0 top-full z-20 -translate-y-2/3 px-4 sm:px-5">
              <div className="flex items-end gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-zinc-100 shadow-lg sm:h-24 sm:w-24">
                  {avatarIsLogoFallback ? (
                    <DirectoryListingPlaceholderImage
                      alt=""
                      fill
                      className="object-contain bg-white p-2"
                      sizes="96px"
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
                      sizes="96px"
                    />
                  )}
                </div>
                <div className="min-w-0 w-full max-w-[16rem] rounded-xl bg-black/45 px-3 py-2.5 shadow-lg backdrop-blur-md sm:max-w-[18rem]">
                  <h2
                    id="photographer-detail-title"
                    className="truncate font-serif text-xl font-semibold text-white"
                  >
                    {displayName(p)}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-white/85">{loc}</p>
                  <p className="mt-1.5 text-sm font-semibold text-amber-100">
                    {formatDirectoryStartingPrice(p)}
                  </p>
                  {focuses.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {focuses.slice(0, 3).map((f) => (
                        <span
                          key={f}
                          className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white"
                        >
                          {f}
                        </span>
                      ))}
                      {focuses.length > 3 ? (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white/85">
                          +{focuses.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <PhotographerSocialIconButtons
                      instagram={p.instagram}
                      website={p.website}
                      twitter={p.twitter}
                      facebook={p.facebook}
                      portfolioLinks={undefined}
                      size="sm"
                    />
                    <ProfileShareDropdown
                      profileSlug={p.profileSlug}
                      placement="below"
                      tone="onDark"
                      iconOnly
                      menuZClass="z-[150]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reserve space for the ~1/3 of the identity block that hangs below the banner */}
          <div className="h-14 sm:h-16" aria-hidden />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pt-2 sm:px-6">
          <div
            className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1"
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

          <section className="mt-3 min-h-0 flex-1 overflow-y-auto pb-2" role="tabpanel">
            {effectiveTab === 'gallery' ? (
              gallery.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  No gallery photos yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {gallery.map((url) => (
                    <button
                      key={url}
                      type="button"
                      className="group aspect-square cursor-pointer overflow-hidden rounded-xl bg-zinc-100"
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
                          width={400}
                          height={400}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : null}

            {effectiveTab === 'bio' && showBio ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {p.bio}
              </p>
            ) : null}

            {effectiveTab === 'pricing' && showPricing ? (
              <PhotographerFocusPricingDisplay
                photographer={p}
                expandAll
                hideTitle
              />
            ) : null}

            {effectiveTab === 'preferences' && showPreferences ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {p.serviceArea?.trim() ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Globe2 className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">
                        Service area
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-900">
                      {p.serviceArea}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">
                      Travel
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-900">
                    {p.openToOtherAreas
                      ? 'Open to working outside their primary area'
                      : 'Primarily serves their listed area'}
                  </p>
                </div>
                {p.interests?.trim() ? (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:col-span-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Heart className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">
                        Interests
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-900">
                      {p.interests}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {effectiveTab === 'contact' && showContact ? (
              phonePublic || emailPublic ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {phonePublic && p.phone?.trim() ? (
                    <a
                      href={`tel:${p.phone!.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Phone
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-zinc-900">
                          {p.phone}
                        </p>
                      </div>
                    </a>
                  ) : null}
                  {emailPublic && p.email?.trim() ? (
                    <a
                      href={`mailto:${p.email}`}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Email
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-zinc-900">
                          {p.email}
                        </p>
                      </div>
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-zinc-600">
                  Contact details are private. Reach out through booking.
                </p>
              )
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
                isSelf={!canRequestBooking}
                onNeedLogin={() => openLoginModal()}
                compact
              />
            ) : null}
          </section>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 border-t border-zinc-100 py-4">
            {p.profileSlug ? (
              <Link
                href={publicPhotographerProfilePath(p.profileSlug)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
              >
                View full profile
                <ExternalLink className="h-4 w-4 opacity-70" />
              </Link>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600">
                {!canRequestBooking ? (
                  <p className="text-xs leading-relaxed">
                    Set a username and profile image, then save to activate your
                    public link.
                  </p>
                ) : (
                  <p>No public profile link</p>
                )}
              </div>
            )}
            {canRequestBooking ? (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
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
            ) : null}
          </div>
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
            className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm hover:bg-white/25"
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

      <CannotFavoriteSelfDialog
        open={selfFavoriteOpen}
        onClose={() => setSelfFavoriteOpen(false)}
      />
    </div>
  );
}
