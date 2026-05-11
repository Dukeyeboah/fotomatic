'use client';

import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  isReservedProfileSlug,
  isValidPublicProfileSlug,
  normalizePublicProfileSlug,
} from '@/lib/public-profile-slug';

/**
 * Reserves `usernameClaims/{slug}` so no two accounts can share the same public handle.
 * Call **before** saving the user document when username changes.
 */
export async function syncUsernameClaimForUser(
  uid: string,
  previousNormalized: string | null | undefined,
  nextRaw: string | null | undefined,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const prev =
    previousNormalized && previousNormalized.trim().length >= 3
      ? normalizePublicProfileSlug(previousNormalized)
      : null;
  const nextTrimmed = (nextRaw ?? '').trim();
  const next =
    nextTrimmed.length >= 3 ? normalizePublicProfileSlug(nextTrimmed) : null;

  if (!prev && !next) {
    return { ok: true };
  }

  if (next) {
    if (!isValidPublicProfileSlug(next) || isReservedProfileSlug(next)) {
      return { ok: false, reason: 'That username is not allowed.' };
    }
  }

  try {
    await runTransaction(db, async (transaction) => {
      const prevRef =
        prev && prev.length >= 3 ? doc(db, 'usernameClaims', prev) : null;
      const nextRef =
        next && next.length >= 3 ? doc(db, 'usernameClaims', next) : null;

      if (nextRef && next) {
        const nextSnap = await transaction.get(nextRef);
        if (nextSnap.exists()) {
          const owner = nextSnap.data()?.uid as string | undefined;
          if (owner && owner !== uid) {
            throw new Error('USERNAME_TAKEN');
          }
        }
      }

      if (prevRef && prev && prev !== next) {
        const prevSnap = await transaction.get(prevRef);
        if (prevSnap.exists()) {
          const owner = prevSnap.data()?.uid as string | undefined;
          if (owner === uid) {
            transaction.delete(prevRef);
          }
        }
      }

      if (nextRef && next) {
        transaction.set(nextRef, {
          uid,
          updatedAt: serverTimestamp(),
        });
      }
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === 'USERNAME_TAKEN') {
      return {
        ok: false,
        reason: 'That username is already taken. Try another.',
      };
    }
    console.error('syncUsernameClaimForUser', e);
    return {
      ok: false,
      reason: 'Could not verify username. Try again.',
    };
  }
}

/** Quick client-side check (reads `usernameClaims` — rules allow public read). */
export async function isUsernameClaimAvailable(
  slugRaw: string,
  exceptUid: string,
): Promise<boolean> {
  const s = normalizePublicProfileSlug(slugRaw);
  if (
    s.length < 3 ||
    !isValidPublicProfileSlug(s) ||
    isReservedProfileSlug(s)
  ) {
    return false;
  }
  try {
    const snap = await getDoc(doc(db, 'usernameClaims', s));
    if (!snap.exists()) return true;
    const owner = snap.data()?.uid as string | undefined;
    return owner === exceptUid;
  } catch {
    return false;
  }
}
