'use client';

import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type PhotographerApplicationStatus =
  | 'submitted'
  | 'approved'
  | 'declined';

export type MyPhotographerApplicationSummary = {
  id: string;
  status: PhotographerApplicationStatus;
  name?: string;
  createdAt?: unknown;
  reviewedAt?: unknown;
};

function firestoreMs(value: unknown): number {
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (
    value &&
    typeof value === 'object' &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}

/**
 * Latest application for this user (by `createdAt`), or null if none / error.
 */
export function subscribeMyPhotographerApplication(
  uid: string,
  onChange: (latest: MyPhotographerApplicationSummary | null) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'photographerApplications'),
    where('applicantUserId', '==', uid),
  );
  return onSnapshot(
    q,
    (snap) => {
      let best: MyPhotographerApplicationSummary | null = null;
      let bestMs = -1;
      for (const d of snap.docs) {
        const data = d.data() as Record<string, unknown>;
        const status = data.status;
        if (
          status !== 'submitted' &&
          status !== 'approved' &&
          status !== 'declined'
        ) {
          continue;
        }
        const ms = firestoreMs(data.createdAt);
        if (ms >= bestMs) {
          bestMs = ms;
          best = {
            id: d.id,
            status,
            name: typeof data.name === 'string' ? data.name : undefined,
            createdAt: data.createdAt,
            reviewedAt: data.reviewedAt,
          };
        }
      }
      onChange(best);
    },
    (e) => {
      console.error('subscribeMyPhotographerApplication', e);
      onChange(null);
    },
  );
}
