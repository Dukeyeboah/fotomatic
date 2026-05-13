/**
 * Marketing / UI images stored under Firebase Storage `fotomatic-images/…`
 * (public read). Falls back to `public/fotomaticImages/` when bucket is unset.
 */
const STORAGE_PREFIX = 'fotomatic-images/';

function baseFileName(pathOrName: string): string {
  const t = pathOrName.trim();
  if (!t) return '';
  const noPublic = t.replace(/^\/+/, '').replace(/^fotomaticImages\/?/i, '');
  const parts = noPublic.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export function marketingImageStoragePath(pathOrName: string): string {
  const name = baseFileName(pathOrName);
  return `${STORAGE_PREFIX}${name}`;
}

export function marketingImagePublicUrl(pathOrName: string): string {
  const name = baseFileName(pathOrName);
  if (!name) return '/fotomaticImages/fotomaticLogo.png';
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    return `/fotomaticImages/${name}`;
  }
  const encoded = encodeURIComponent(`${STORAGE_PREFIX}${name}`);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

/** Card / modal / profile when a directory photographer has not set a photo yet. */
export function directoryListingFallbackImageUrl(): string {
  return marketingImagePublicUrl('fotomaticLogo.png');
}

/** True when `url` is the directory “no photo” logo (Storage or local public path). */
export function isDirectoryListingFallbackUrl(url: string): boolean {
  const u = url.trim();
  if (!u) return false;
  if (u === directoryListingFallbackImageUrl()) return true;
  return u === '/fotomaticImages/fotomaticLogo.png';
}
