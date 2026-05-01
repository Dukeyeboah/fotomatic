import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './config';

/** Extended fields for users with role `photographer`. */
export interface PhotographerProfileFields {
  bio?: string;
  style?: string;
  /** Primary specialty (directory + application). */
  photographyFocus?: string;
  interests?: string;
  behance?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolioUrl?: string;
  bannerImageUrl?: string;
  profileImageUrl?: string;
  /**
   * Directory id like `dir-12` or `p-{uid}` so bookings from the public directory
   * can be shown in this photographer admin UI.
   */
  directoryId?: string | null;
  /** Optional published hourly rate used at acceptance time. */
  hourlyRate?: number | null;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  phoneContact?: boolean;
  emailContact?: boolean;
  serviceArea?: string;
  openToOtherAreas?: boolean;
}

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  /** Lowercase handle from email local-part by default; editable. */
  username?: string | null;
  role: 'user' | 'photographer' | 'admin';
  city?: string | null;
  state?: string | null;
  country?: string | null;
  photographer?: PhotographerProfileFields;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function emailLocalPart(email: string | null | undefined): string | null {
  if (!email || !email.includes('@')) return null;
  const local = email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9._-]/gi, '');
  return local || null;
}

/** Safe defaults when Firestore has not loaded yet; avoids `undefined` (Firestore rejects it). */
export function defaultUserDataFromAuth(authUser: User): UserData {
  return {
    uid: authUser.uid,
    email: authUser.email ?? null,
    displayName: authUser.displayName ?? null,
    photoURL: authUser.photoURL ?? null,
    username: emailLocalPart(authUser.email),
    role: 'user',
  };
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserData;
}

/**
 * Creates or patches the Firestore user doc from Firebase Auth (e.g. after Google sign-in).
 * Call when Firestore is available so booking and profile work.
 */
export async function ensureUserProfile(authUser: User): Promise<UserData> {
  const ref = doc(db, 'users', authUser.uid);
  const snap = await getDoc(ref);
  const username = emailLocalPart(authUser.email);

  if (!snap.exists()) {
    const data: Record<string, unknown> = {
      uid: authUser.uid,
      email: authUser.email ?? null,
      displayName: authUser.displayName ?? null,
      photoURL: authUser.photoURL ?? null,
      username,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    return data as unknown as UserData;
  }

  const existing = snap.data() as UserData;
  const merge: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (username && !existing.username) merge.username = username;
  if (authUser.photoURL && existing.photoURL !== authUser.photoURL) {
    merge.photoURL = authUser.photoURL;
  }
  if (authUser.displayName && !existing.displayName) {
    merge.displayName = authUser.displayName;
  }
  if (Object.keys(merge).length > 1) {
    await setDoc(ref, merge, { merge: true });
  }
  return { ...existing, ...(merge as Partial<UserData>) } as UserData;
}

function omitUndefinedDeep(
  value: Record<string, unknown>,
): Record<string, unknown> {
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

export async function updateUserDocument(
  uid: string,
  patch: Partial<UserData>,
): Promise<boolean> {
  try {
    const { uid: _ignore, ...rest } = patch as UserData & { uid?: string };
    const cleaned = omitUndefinedDeep(rest as Record<string, unknown>);
    await setDoc(
      doc(db, 'users', uid),
      { ...cleaned, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return true;
  } catch (e) {
    console.error('updateUserDocument', e);
    return false;
  }
}

export async function promoteToPhotographerRole(uid: string): Promise<boolean> {
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        role: 'photographer',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (e) {
    console.error('promoteToPhotographerRole', e);
    return false;
  }
}
