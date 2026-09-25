import type { DirectoryPhotographer } from '@/lib/photographers-directory';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';

function focusSet(p: DirectoryPhotographer): Set<string> {
  return new Set(
    parsePhotographyFocusesFromFirestore({
      photographyFocuses: p.photographyFocuses,
      photographyFocus: p.photographyFocus,
    }).map((f) => f.trim().toLowerCase()),
  );
}

function scoreSimilarity(
  seed: DirectoryPhotographer,
  candidate: DirectoryPhotographer,
): number {
  const seedFocus = focusSet(seed);
  const candFocus = focusSet(candidate);
  let shared = 0;
  for (const f of candFocus) {
    if (seedFocus.has(f)) shared += 1;
  }

  let score = shared * 100;

  const seedCity = seed.city?.trim().toLowerCase() ?? '';
  const seedState = seed.state?.trim().toLowerCase() ?? '';
  const seedCountry = seed.country?.trim().toLowerCase() ?? '';
  const candCity = candidate.city?.trim().toLowerCase() ?? '';
  const candState = candidate.state?.trim().toLowerCase() ?? '';
  const candCountry = candidate.country?.trim().toLowerCase() ?? '';

  if (seedCity && candCity && seedCity === candCity) score += 20;
  if (seedState && candState && seedState === candState) score += 12;
  if (seedCountry && candCountry && seedCountry === candCountry) score += 6;

  return score;
}

/**
 * Rank other listed photographers by shared specialty, then nearby location.
 * Falls back to location-only matches when the seed has no focuses.
 */
export function findSimilarPhotographers(
  seed: DirectoryPhotographer,
  directory: DirectoryPhotographer[],
  limit = 6,
): DirectoryPhotographer[] {
  const ranked = directory
    .filter((p) => p.id !== seed.id)
    .map((p) => ({ p, score: scoreSimilarity(seed, p) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.p.firstName.localeCompare(b.p.firstName));

  if (ranked.length >= Math.min(3, limit)) {
    return ranked.slice(0, limit).map((r) => r.p);
  }

  // Soft fallback: fill with remaining directory rows if we don't have enough matches.
  const seen = new Set(ranked.map((r) => r.p.id));
  const fill = directory.filter((p) => p.id !== seed.id && !seen.has(p.id));
  return [...ranked.map((r) => r.p), ...fill].slice(0, limit);
}
