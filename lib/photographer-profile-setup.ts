import type { UserData } from '@/lib/firebase/user-profile';
import {
  isValidPublicProfileSlug,
  normalizePublicProfileSlug,
} from '@/lib/public-profile-slug';

/** True when public handle, avatar, or banner still need attention for a shareable profile. */
export function needsGuidedPhotographerProfile(userData: UserData): boolean {
  if (userData.role !== 'photographer') return false;
  const slug = normalizePublicProfileSlug(userData.username ?? '');
  const slugOk = isValidPublicProfileSlug(slug);
  const hasAvatar =
    Boolean(userData.photographer?.profileImageUrl?.trim()) ||
    Boolean(userData.photoURL?.trim());
  const hasBanner = Boolean(userData.photographer?.bannerImageUrl?.trim());
  return !slugOk || !hasAvatar || !hasBanner;
}
