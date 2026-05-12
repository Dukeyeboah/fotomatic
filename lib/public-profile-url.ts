/** Public profile URL: `/photographer/{slug}` (not the directory listing). */
export function publicPhotographerProfilePath(slug: string): string {
  const s = slug.trim().toLowerCase();
  return `/photographer/${encodeURIComponent(s)}`;
}

export function buildPublicPhotographerProfileUrl(slug: string): string {
  if (typeof window === 'undefined') {
    return publicPhotographerProfilePath(slug);
  }
  return `${window.location.origin}${publicPhotographerProfilePath(slug)}`;
}
