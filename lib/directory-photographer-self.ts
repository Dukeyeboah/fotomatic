import type { DirectoryPhotographer } from '@/lib/photographers-directory';

/**
 * True when the signed-in viewer is a photographer and this directory row is
 * their own synced listing (`photographer.directoryId` or default `p-{uid}`).
 */
export function isOwnDirectoryPhotographerListing(
  photographer: DirectoryPhotographer,
  viewer: {
    uid: string | null | undefined;
    role: string | null | undefined;
    directoryId?: string | null;
  },
): boolean {
  if (!viewer.uid || viewer.role !== 'photographer') return false;
  const configured = viewer.directoryId?.trim();
  if (configured) {
    return photographer.id === configured;
  }
  return photographer.id === `p-${viewer.uid}`;
}
