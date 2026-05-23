/**
 * Marketing / UI images: primary copy in Firebase Storage (`fotomatic-images/…`),
 * with identical files in `public/fotomaticImages/` as fallback.
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

/** Firebase Storage download URL (requires public read on `fotomatic-images/`). */
export function marketingImageStoragePublicUrl(pathOrName: string): string {
  const name = baseFileName(pathOrName) || LOGO_FILE;
  const bucket = storageBucket();
  if (!bucket) return marketingImageLocalUrl(name);
  const encoded = encodeURIComponent(`${STORAGE_PREFIX}${name}`);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}

/**
 * Preferred URL for marketing assets: Storage when configured, else local public files.
 */
export function marketingImagePrimaryUrl(pathOrName: string): string {
  const name = baseFileName(pathOrName);
  if (!name) return marketingImageLocalUrl(LOGO_FILE);
  if (storageBucket()) return marketingImageStoragePublicUrl(name);
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
