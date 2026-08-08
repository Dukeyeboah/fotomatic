/** Single URL segment for `/photographer/{slug}` public photographer pages. */
const RESERVED = new Set([
  'api',
  'admin',
  'dashboard',
  'home',
  'login',
  'logout',
  'profile',
  'account',
  'contact',
  'messages',
  'notifications',
  'photographers',
  'photographer',
  'orders',
  'photo-admin',
  'support',
  'privacy',
  'terms',
  'help',
  'about',
  'blog',
  'careers',
  'legal',
  'settings',
  'saved',
  'favorites',
  'bookings',
  /** App routes under `/photographer/…` — cannot be usernames. */
  'directory',
  'calendar',
  'earnings',
  'requests',
  'reviews',
  'payments',
  'register',
  'signup',
  'signin',
  'oauth',
  'static',
  'public',
  'fonts',
  'icons',
  'fotomaticimages',
  'photographerimages',
]);

export function normalizePublicProfileSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isReservedProfileSlug(slug: string): boolean {
  const s = normalizePublicProfileSlug(slug);
  if (!s) return true;
  if (RESERVED.has(s)) return true;
  if (s.startsWith('_')) return true;
  if (s.startsWith('.')) return true;
  return false;
}

/** Basic handle: letters, numbers, underscore, hyphen; 3–40 chars. */
export function isValidPublicProfileSlug(slug: string): boolean {
  const s = normalizePublicProfileSlug(slug);
  if (s.length < 3 || s.length > 40) return false;
  return /^[a-z0-9][a-z0-9_-]*$/.test(s);
}
