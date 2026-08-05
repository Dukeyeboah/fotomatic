'use client';

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '@/lib/firebase/config';

export type PlatformPaymentSettings = {
  /** Minimum general starting price photographers may set (USD). */
  minPhotographerStartingPrice: number;
  /** Maximum general starting price (USD). */
  maxPhotographerStartingPrice: number;
  /** Display-only note for admins about Connect share (env still authoritative for transfers). */
  notes?: string;
  updatedAt?: unknown;
};

export const DEFAULT_PLATFORM_PAYMENT_SETTINGS: PlatformPaymentSettings = {
  minPhotographerStartingPrice: 50,
  maxPhotographerStartingPrice: 5000,
  notes: '',
};

const SETTINGS_REF = doc(db, 'platformSettings', 'payment');

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function errMessage(e: unknown): string {
  if (e instanceof FirebaseError) return e.message;
  return 'Something went wrong.';
}

function normalize(data: Record<string, unknown> | undefined): PlatformPaymentSettings {
  const minRaw = data?.minPhotographerStartingPrice;
  const maxRaw = data?.maxPhotographerStartingPrice;
  const min =
    typeof minRaw === 'number' && Number.isFinite(minRaw)
      ? Math.max(0, Math.round(minRaw))
      : DEFAULT_PLATFORM_PAYMENT_SETTINGS.minPhotographerStartingPrice;
  const max =
    typeof maxRaw === 'number' && Number.isFinite(maxRaw)
      ? Math.max(min, Math.round(maxRaw))
      : DEFAULT_PLATFORM_PAYMENT_SETTINGS.maxPhotographerStartingPrice;
  return {
    minPhotographerStartingPrice: min,
    maxPhotographerStartingPrice: max,
    notes:
      typeof data?.notes === 'string'
        ? data.notes
        : DEFAULT_PLATFORM_PAYMENT_SETTINGS.notes,
    updatedAt: data?.updatedAt,
  };
}

export function subscribePlatformPaymentSettings(
  cb: (settings: PlatformPaymentSettings) => void,
): Unsubscribe {
  return onSnapshot(
    SETTINGS_REF,
    (snap) => {
      cb(normalize(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined));
    },
    (e) => {
      console.error('subscribePlatformPaymentSettings', e);
      cb(DEFAULT_PLATFORM_PAYMENT_SETTINGS);
    },
  );
}

export async function getPlatformPaymentSettings(): Promise<PlatformPaymentSettings> {
  try {
    const snap = await getDoc(SETTINGS_REF);
    return normalize(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
  } catch (e) {
    console.error('getPlatformPaymentSettings', e);
    return DEFAULT_PLATFORM_PAYMENT_SETTINGS;
  }
}

export async function savePlatformPaymentSettings(
  patch: Partial<PlatformPaymentSettings>,
): Promise<Result<true>> {
  try {
    const cleaned: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (typeof patch.minPhotographerStartingPrice === 'number') {
      cleaned.minPhotographerStartingPrice = Math.max(
        0,
        Math.round(patch.minPhotographerStartingPrice),
      );
    }
    if (typeof patch.maxPhotographerStartingPrice === 'number') {
      cleaned.maxPhotographerStartingPrice = Math.max(
        0,
        Math.round(patch.maxPhotographerStartingPrice),
      );
    }
    if (typeof patch.notes === 'string') {
      cleaned.notes = patch.notes.slice(0, 2000);
    }
    await setDoc(SETTINGS_REF, cleaned, { merge: true });
    return { ok: true, value: true };
  } catch (e) {
    console.error('savePlatformPaymentSettings', e);
    return { ok: false, message: errMessage(e) };
  }
}
