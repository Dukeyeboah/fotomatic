/** Path segment for public photographer pages: `/photographers/{slug}`. */
export function publicPhotographerProfilePath(slug: string): string {
  const s = slug.trim().toLowerCase();
  return `/photographers/${encodeURIComponent(s)}`;
}

export function buildPublicPhotographerProfileUrl(slug: string): string {
  if (typeof window === 'undefined') {
    return publicPhotographerProfilePath(slug);
  }
  return `${window.location.origin}${publicPhotographerProfilePath(slug)}`;
}
