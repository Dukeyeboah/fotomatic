'use client';

import raw from '@/data/photographers.json';
import { FirebaseError } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Photographer } from '@/lib/firebase/firestore';

type JsonRow = Record<string, string | boolean | undefined>;

function str(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

function bool(v: unknown): boolean {
  return Boolean(v);
}

function normalizeStage(stage: string): Photographer['status'] {
  const s = stage.trim().toLowerCase();
  if (s.includes('interested')) return 'interested-follow-up';
  if (s.includes('not interested')) return 'not-interested/no-response';
  if (s.includes('not-contact')) return 'not-contacted';
  return 'contacted';
}

function titleCaseWords(s: string): string {
  if (!s) return '';
  return s
    .split(/\s+/)
    .map((w) =>
      w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(' ');
}

export function seedPhotographersFromJson(): Array<{
  id: string;
  data: Omit<Photographer, 'id' | 'createdAt' | 'updatedAt'>;
}> {
  const rows = raw as JsonRow[];
  return rows.map((row, index) => {
    const firstName = str(row['First Name']) || 'Photographer';
    const lastName = str(row['Last Name']) || undefined;
    const email = str(row['Email']) || undefined;
    const website = str(row['Website']) || undefined;
    const instagram = str(row['Instagram']) || undefined;
    const phone = str(row['Phone Number']) || undefined;
    const address = str(row['Address']) || undefined;
    const stateRaw = str(row['State']);
    const state = stateRaw ? titleCaseWords(stateRaw) : undefined;
    const stage = str(row['Contact Stage']);
    const status = normalizeStage(stage);

    const data: Omit<Photographer, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName,
      lastName,
      email,
      website,
      instagram,
      phone,
      address,
      city: address || undefined,
      state,
      country: state ? 'United States' : undefined,
      status,
      instagramContact: bool(row['Instagram-contact']),
      emailContact: bool(row['Email-contact']),
      phoneContact: bool(row['Phone-contact']),
      name: [firstName, lastName].filter(Boolean).join(' ') || firstName,
      location: [address, state].filter(Boolean).join(', ') || undefined,
    };

    return { id: `dir-${index}`, data };
  });
}

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function firebaseErrMessage(e: unknown): string {
  if (e instanceof FirebaseError) return `${e.code}: ${e.message}`;
  return 'Something went wrong.';
}

const photographersCol = collection(db, 'photographers');

export function subscribePhotographersDirectory(
  cb: (items: Photographer[]) => void,
): Unsubscribe {
  return onSnapshot(
    photographersCol,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Photographer, 'id'>),
        })),
      );
    },
    (err) => {
      console.error('subscribePhotographersDirectory', err);
      cb([]);
    },
  );
}

export async function adminUpsertPhotographer(
  id: string,
  patch: Partial<Photographer> & Record<string, unknown>,
): Promise<Result<true>> {
  try {
    const { id: _ignore, ...rest } = patch as Photographer & {
      id?: string;
    } & Record<string, unknown>;
    const cleaned = omitUndefinedDeep(rest as Record<string, unknown>);
    await setDoc(
      doc(photographersCol, id),
      { ...cleaned, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return { ok: true, value: true };
  } catch (e) {
    console.error('adminUpsertPhotographer', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function adminDeletePhotographer(id: string): Promise<Result<true>> {
  try {
    /**
     * Soft-delists instead of deleting the document. A hard delete was being
     * undone by `syncPhotographerPublicDirectory` on the photographer’s next
     * session (merge `setDoc` recreates the row). `listed: false` is respected by
     * sync and filtered out of the public directory UI.
     */
    await setDoc(
      doc(photographersCol, id),
      { listed: false, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return { ok: true, value: true };
  } catch (e) {
    console.error('adminDeletePhotographer', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

/**
 * Hard-deletes the `photographers/{id}` document. Only allowed after the row
 * has been delisted (`listed: false`) so we never wipe an active listing by
 * accident. If the account is still a photographer, sync may recreate a fresh
 * doc the next time they use the app.
 */
export async function adminPermanentlyDeletePhotographerDoc(
  id: string,
): Promise<Result<true>> {
  try {
    const ref = doc(photographersCol, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { ok: true, value: true };
    }
    const data = snap.data() as { listed?: unknown };
    if (data.listed !== false) {
      return {
        ok: false,
        message:
          'Remove this listing from the directory first. Permanent delete is only available for delisted rows.',
      };
    }
    await deleteDoc(ref);
    return { ok: true, value: true };
  } catch (e) {
    console.error('adminPermanentlyDeletePhotographerDoc', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function adminSyncPhotographersFromJson(): Promise<
  Result<{ count: number }>
> {
  try {
    const seed = seedPhotographersFromJson();
    for (const p of seed) {
      const cleaned = omitUndefinedDeep(p.data as Record<string, unknown>);
      await setDoc(
        doc(photographersCol, p.id),
        { ...cleaned, updatedAt: serverTimestamp() },
        { merge: true },
      );
    }
    return { ok: true, value: { count: seed.length } };
  } catch (e) {
    console.error('adminSyncPhotographersFromJson', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

function omitUndefinedDeep(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const nested = omitUndefinedDeep(v as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[k] = nested;
    } else {
      out[k] = v;
    }
  }
  return out;
}

