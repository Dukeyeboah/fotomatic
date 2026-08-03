/**
 * Marketing / UI images live in `public/fotomaticImages/` (always available).
 * Optional Firebase Storage copies under `fotomatic-images/` are not used as
 * the primary src — tokenless Storage URLs 403 and spam Next.js image logs.
 */
const STORAGE_PREFIX = 'fotomatic-images/';
const PUBLIC_BASE = '/fotomaticImages';
const LOGO_FILE = 'fotomaticLogo.png';

function baseFileName(pathOrName: string): string {
  const t = pathOrName.trim();
  if (!t) return '';
  const noPublic = t.replace(/^\/+/, '').replace(/^fotomaticImages\/?/i, '');
  const parts = noPublic.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

function storageBucket(): string | null {
  return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || null;
}

export function marketingImageStoragePath(pathOrName: string): string {
  const name = baseFileName(pathOrName);
  return `${STORAGE_PREFIX}${name}`;
}

/** Always served from the Next.js app (`public/fotomaticImages/`). */
export function marketingImageLocalUrl(pathOrName: string): string {
  const name = baseFileName(pathOrName) || LOGO_FILE;
  return `${PUBLIC_BASE}/${name}`;
}

/** Firebase Storage download URL (requires deployed public read + object exists). */
export function marketingImageStoragePublicUrl(pathOrName: string): string {
  const name = baseFileName(pathOrName) || LOGO_FILE;
  const bucket = storageBucket();
  if (!bucket) return marketingImageLocalUrl(name);
  const encoded = encodeURIComponent(`${STORAGE_PREFIX}${name}`);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

/**
 * Preferred URL for marketing assets: local public files (reliable).
 * Set NEXT_PUBLIC_MARKETING_IMAGES_FROM_STORAGE=true to try Storage first.
 */
export function marketingImagePrimaryUrl(pathOrName: string): string {
  const name = baseFileName(pathOrName);
  if (!name) return marketingImageLocalUrl(LOGO_FILE);
  const useStorage =
    process.env.NEXT_PUBLIC_MARKETING_IMAGES_FROM_STORAGE === 'true' ||
    process.env.NEXT_PUBLIC_MARKETING_IMAGES_FROM_STORAGE === '1';
  if (useStorage && storageBucket()) return marketingImageStoragePublicUrl(name);
  return marketingImageLocalUrl(name);
}

/** @deprecated Use `marketingImagePrimaryUrl` — kept for existing imports. */
export function marketingImagePublicUrl(pathOrName: string): string {
  return marketingImagePrimaryUrl(pathOrName);
}

/** Fallback path when Storage (or primary) fails to load. */
export function marketingImageFallbackUrl(pathOrName: string): string {
  return marketingImageLocalUrl(pathOrName);
}

export function marketingImageSources(pathOrName: string): {
  primary: string;
  fallback: string;
} {
  const name = baseFileName(pathOrName) || LOGO_FILE;
  return {
    primary: marketingImagePrimaryUrl(name),
    fallback: marketingImageLocalUrl(name),
  };
}

/** Card / modal / profile when a directory photographer has not set a photo yet. */
export function directoryListingFallbackImageUrl(): string {
  return marketingImagePrimaryUrl(LOGO_FILE);
}

/** True when `url` is the Fotomatic logo placeholder (Storage or local). */
export function isDirectoryListingFallbackUrl(url: string): boolean {
  return isMarketingAssetUrl(url, LOGO_FILE);
}

export function isMarketingAssetUrl(url: string, pathOrName: string): boolean {
  const u = url.trim();
  if (!u) return false;
  const name = baseFileName(pathOrName);
  if (!name) return false;
  return (
    u === marketingImageLocalUrl(name) ||
    u === marketingImagePrimaryUrl(name) ||
    u === marketingImageStoragePublicUrl(name)
  );
}
