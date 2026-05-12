import type { DirectoryPhotographer } from '@/lib/photographers-directory';

/** Phone visible on `/photographer/{slug}` when set and allowed. */
export function isPhoneShownOnPublicProfile(p: DirectoryPhotographer): boolean {
  if (p.publicPhoneOnProfile === false) return false;
  if (p.publicPhoneOnProfile === true) return Boolean(p.phone?.trim());
  return Boolean(p.phone?.trim()) && p.phoneContact === true;
}

/** Email visible on public profile page. */
export function isEmailShownOnPublicProfile(p: DirectoryPhotographer): boolean {
  if (p.publicEmailOnProfile === false) return false;
  if (p.publicEmailOnProfile === true) return Boolean(p.email?.trim());
  return Boolean(p.email?.trim()) && p.emailContact === true;
}

export function hasPublicContactTabContent(p: DirectoryPhotographer): boolean {
  return Boolean(p.phone?.trim()) || Boolean(p.email?.trim());
}
