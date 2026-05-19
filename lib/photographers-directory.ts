import type { FocusEventPricing } from '@/lib/photographer-pricing';
import { parseEventPricingFromFirestore } from '@/lib/photographer-pricing';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';

/** Normalized photographer for the public directory (Firestore `photographers` docs). */
export type DirectoryPhotographer = {
  id: string;
  source: 'firestore';
  firstName: string;
  lastName?: string;
  email?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  /** City / area line */
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  /** Portfolio hero fallback when `photoUrl` is empty */
  galleryImageUrls?: string[];
  /** General event starting price (USD). Legacy field `startingHourlyRate` still read. */
  startingPrice?: number;
  /** @deprecated Use `startingPrice`; kept for older docs and booking threads. */
  startingHourlyRate: number;
  /** From Firestore directory doc after profile sync */
  bio?: string;
  interests?: string;
  bannerImageUrl?: string;
  /** Legacy comma-separated summary; prefer `photographyFocuses`. */
  photographyFocus?: string;
  photographyFocuses?: string[];
  /** Optional per-specialty starting prices and notes. */
  eventPricing?: FocusEventPricing[];
  /** General notes about add-ons, deposits, etc. */
  pricingNotes?: string;
  serviceArea?: string;
  portfolioLinks?: string;
  openToOtherAreas?: boolean;
  /** Public URL path `/photographer/{profileSlug}` when synced from account username. */
  profileSlug?: string;
  phone?: string;
  phoneContact?: boolean;
  emailContact?: boolean;
  /** When true/false, overrides legacy `phoneContact` for public profile visibility. */
  publicPhoneOnProfile?: boolean;
  /** When true/false, overrides legacy `emailContact` for public profile visibility. */
  publicEmailOnProfile?: boolean;
};

export const DIRECTORY_GALLERY_MAX = 15;

/** Card / modal hero: profile image, else first gallery shot, else placeholder. */
export function directoryPhotographerHeroImageUrl(
  p: DirectoryPhotographer,
): string | undefined {
  const main = p.photoUrl?.trim();
  if (main) return main;
  const first = p.galleryImageUrls?.find((u) => typeof u === 'string' && u.trim());
  return first?.trim() || undefined;
}

function str(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

/** Stable placeholder image index `1`…`26` for `dir-*` or Firestore `p-*` ids. */
export function placeholderImageIndexFromDirectoryId(id: string): number {
  const m = /^dir-(\d+)$/.exec(id);
  if (m) {
    const idx = parseInt(m[1]!, 10);
    return (idx % 26) + 1;
  }
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 26) + 1;
}

export function photographerPlaceholderImagePath(id: string): string {
  const n = placeholderImageIndexFromDirectoryId(id);
  return `/photographerImages/${n}.jpg`;
}

/** Map a public `photographers/{docId}` document to directory shape. */
export function firestoreDocToDirectory(
  docId: string,
  data: Record<string, unknown>,
): DirectoryPhotographer | null {
  if (data.listed === false) return null;
  const firstName =
    str(data.firstName) || str(data.name).split(/\s+/)[0] || 'Photographer';
  const lastNameRaw = str(data.lastName);
  const lastName =
    lastNameRaw ||
    (str(data.name).includes(' ')
      ? str(data.name).split(/\s+/).slice(1).join(' ')
      : undefined);
  const rateRaw = data.startingPrice ?? data.startingHourlyRate;
  const rate =
    typeof rateRaw === 'number'
      ? rateRaw
      : typeof rateRaw === 'string'
        ? parseFloat(rateRaw)
        : NaN;
  const startingPrice = Number.isFinite(rate)
    ? Math.min(9999, Math.max(0, rate))
    : 150;
  const startingHourlyRate = startingPrice;

  let galleryImageUrls: string[] | undefined;
  const gRaw = data.galleryImageUrls;
  if (Array.isArray(gRaw)) {
    const urls = gRaw
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
      .map((u) => u.trim())
      .slice(0, DIRECTORY_GALLERY_MAX);
    if (urls.length > 0) galleryImageUrls = urls;
  }

  const bio = data.bio != null ? str(data.bio) : '';
  const interests = data.interests != null ? str(data.interests) : '';
  const bannerImageUrl =
    data.bannerImageUrl != null ? str(data.bannerImageUrl) : '';
  const photographyFocuses = parsePhotographyFocusesFromFirestore({
    photographyFocuses: data.photographyFocuses,
    photographyFocus: data.photographyFocus,
  });
  const photographyFocus =
    photographyFocuses.length > 0
      ? photographyFocuses.join(', ')
      : data.photographyFocus != null
        ? str(data.photographyFocus)
        : '';
  const eventPricing = parseEventPricingFromFirestore(data.eventPricing);
  const pricingNotes =
    data.pricingNotes != null ? str(data.pricingNotes) : '';
  const serviceArea = data.serviceArea != null ? str(data.serviceArea) : '';
  const portfolioLinks =
    data.portfolioLinks != null ? str(data.portfolioLinks) : '';
  const profileSlugRaw =
    data.profileSlug != null ? str(data.profileSlug) : '';
  const profileSlug = profileSlugRaw || undefined;
  const phone = data.phone != null ? str(data.phone) : '';
  const phoneContact = data.phoneContact === true;
  const emailContact = data.emailContact === true;
  const publicPhoneOnProfile =
    data.publicPhoneOnProfile === true
      ? true
      : data.publicPhoneOnProfile === false
        ? false
        : undefined;
  const publicEmailOnProfile =
    data.publicEmailOnProfile === true
      ? true
      : data.publicEmailOnProfile === false
        ? false
        : undefined;

  return {
    id: docId,
    source: 'firestore',
    firstName,
    lastName: lastName || undefined,
    email: data.email != null ? str(data.email) : undefined,
    website: data.website != null ? str(data.website) : undefined,
    instagram: data.instagram != null ? str(data.instagram) : undefined,
    twitter: data.twitter != null ? str(data.twitter) : undefined,
    facebook: data.facebook != null ? str(data.facebook) : undefined,
    city: data.city != null ? str(data.city) : undefined,
    state: data.state != null ? str(data.state) : undefined,
    country: data.country != null ? str(data.country) : undefined,
    photoUrl: data.photoUrl != null ? str(data.photoUrl) : undefined,
    galleryImageUrls,
    startingPrice,
    startingHourlyRate,
    bio: bio || undefined,
    interests: interests || undefined,
    bannerImageUrl: bannerImageUrl || undefined,
    photographyFocus: photographyFocus || undefined,
    photographyFocuses:
      photographyFocuses.length > 0 ? photographyFocuses : undefined,
    eventPricing: eventPricing.length > 0 ? eventPricing : undefined,
    pricingNotes: pricingNotes || undefined,
    serviceArea: serviceArea || undefined,
    portfolioLinks: portfolioLinks || undefined,
    openToOtherAreas:
      data.openToOtherAreas === true ? true : undefined,
    profileSlug,
    phone: phone || undefined,
    phoneContact: phoneContact ? true : undefined,
    emailContact: emailContact ? true : undefined,
    publicPhoneOnProfile,
    publicEmailOnProfile,
  };
}
