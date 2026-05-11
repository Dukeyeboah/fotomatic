'use client';

import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  firestoreDocToDirectory,
  type DirectoryPhotographer,
} from '@/lib/photographers-directory';
import {
  isReservedProfileSlug,
  normalizePublicProfileSlug,
} from '@/lib/public-profile-slug';

/**
 * Load a listed directory photographer by public profile slug (synced from username).
 */
export async function fetchPhotographerByProfileSlug(
  slug: string,
): Promise<DirectoryPhotographer | null> {
  const s = normalizePublicProfileSlug(slug);
  if (!s || isReservedProfileSlug(s)) return null;
  try {
    const q = query(
      collection(db, 'photographers'),
      where('profileSlug', '==', s),
      limit(5),
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      if (data.listed === false) continue;
      const row = firestoreDocToDirectory(d.id, data);
      if (row) return row;
    }
    return null;
  } catch (e) {
    console.error('fetchPhotographerByProfileSlug', e);
    return null;
  }
}
