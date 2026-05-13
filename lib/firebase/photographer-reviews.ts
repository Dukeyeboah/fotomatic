'use client';

import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type PhotographerReview = {
  id?: string;
  photographerDirectoryId: string;
  reviewerUserId: string;
  reviewerDisplayName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt?: unknown;
};

const reviewsCol = collection(db, 'photographerReviews');
const LIST_CAP = 1500;

export function reviewDocId(
  photographerDirectoryId: string,
  reviewerUserId: string,
): string {
  const dir = photographerDirectoryId.trim().replace(/[/\\]/g, '_');
  return `${dir}__${reviewerUserId}`;
}

function firebaseErrMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    if (e.code === 'permission-denied') {
      return 'You don’t have permission to do that. If you’re signed in, try again after refreshing; otherwise check that Firestore rules are deployed.';
    }
    return 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export type ReviewSubmitResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitPhotographerReview(args: {
  photographerDirectoryId: string;
  reviewerUserId: string;
  reviewerDisplayName: string | null;
  rating: number;
  comment: string | null;
}): Promise<ReviewSubmitResult> {
  const dir = args.photographerDirectoryId.trim();
  if (!dir) return { ok: false, message: 'Missing photographer.' };
  const r = Math.round(args.rating);
  if (r < 1 || r > 5) return { ok: false, message: 'Pick a rating from 1 to 5 stars.' };
  const id = reviewDocId(dir, args.reviewerUserId);
  const text = (args.comment ?? '').trim().slice(0, 2000);
  try {
    const ref = doc(reviewsCol, id);
    const existing = await getDoc(ref);
    await setDoc(
      ref,
      {
        photographerDirectoryId: dir,
        reviewerUserId: args.reviewerUserId,
        reviewerDisplayName: args.reviewerDisplayName?.trim() || null,
        rating: r,
        comment: text || null,
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true },
    );
    return { ok: true };
  } catch (e) {
    console.error('submitPhotographerReview', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function fetchMyReviewForPhotographer(args: {
  photographerDirectoryId: string;
  reviewerUserId: string;
}): Promise<PhotographerReview | null> {
  const id = reviewDocId(args.photographerDirectoryId, args.reviewerUserId);
  const snap = await getDoc(doc(reviewsCol, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PhotographerReview, 'id'>) };
}

export function subscribeReviewsForPhotographerDirectory(
  photographerDirectoryId: string | undefined,
  cb: (reviews: PhotographerReview[]) => void,
): Unsubscribe {
  const dir = photographerDirectoryId?.trim();
  if (!dir) {
    cb([]);
    return () => {};
  }
  const q = query(
    reviewsCol,
    where('photographerDirectoryId', '==', dir),
    limit(LIST_CAP),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PhotographerReview, 'id'>),
      }));
      rows.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
      cb(rows);
    },
    (err) => {
      console.error('subscribeReviewsForPhotographerDirectory', err);
      cb([]);
    },
  );
}

/** One listener for directory cards: aggregate average + count per photographer id. */
export function subscribeAllPhotographerReviewStats(
  cb: (stats: Map<string, { average: number; count: number }>) => void,
): Unsubscribe {
  const q = query(reviewsCol, limit(LIST_CAP));
  return onSnapshot(
    q,
    (snap) => {
      const acc = new Map<string, { sum: number; count: number }>();
      for (const d of snap.docs) {
        const data = d.data() as Partial<PhotographerReview>;
        const pid = data.photographerDirectoryId?.trim();
        const rating = typeof data.rating === 'number' ? data.rating : NaN;
        if (!pid || !Number.isFinite(rating) || rating < 1 || rating > 5) continue;
        const cur = acc.get(pid) ?? { sum: 0, count: 0 };
        cur.sum += rating;
        cur.count += 1;
        acc.set(pid, cur);
      }
      const out = new Map<string, { average: number; count: number }>();
      for (const [pid, agg] of acc) {
        const { sum, count } = agg;
        out.set(pid, {
          average: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
          count,
        });
      }
      cb(out);
    },
    (err) => {
      console.error('subscribeAllPhotographerReviewStats', err);
      cb(new Map());
    },
  );
}

function ms(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (v && typeof v === 'object' && 'seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
    return (v as { seconds: number }).seconds * 1000;
  }
  return 0;
}

export function averageRatingFromReviews(
  reviews: PhotographerReview[],
): { average: number; count: number } {
  let sum = 0;
  let n = 0;
  for (const r of reviews) {
    if (typeof r.rating !== 'number' || r.rating < 1 || r.rating > 5) continue;
    sum += r.rating;
    n += 1;
  }
  return {
    count: n,
    average: n > 0 ? Math.round((sum / n) * 10) / 10 : 0,
  };
}
