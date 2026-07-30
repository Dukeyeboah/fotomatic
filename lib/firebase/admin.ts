'use client';

import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
  doc,
  getDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BookingThread, AppNotification } from './booking-threads';
import type { UserData } from './user-profile';

export type PhotographerApplication = {
  id?: string;
  applicantUserId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  startingPrice?: number;
  startingHourlyRate?: number;
  bio?: string;
  photographyFocus?: string;
  photographyFocuses?: string[];
  eventPricing?: Array<{
    focus: string;
    startingPrice: number;
    notes?: string;
  }>;
  pricingNotes?: string;
  phone?: string;
  phoneContact?: boolean;
  emailContact?: boolean;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  portfolioLinks?: string;
  serviceArea?: string;
  openToOtherAreas?: boolean;
  howDidYouHear?: string;
  interestedInClientWork: boolean;
  status: 'submitted' | 'approved' | 'declined';
  source: 'fotomatic';
  createdAt?: unknown;
};

const threadsCol = collection(db, 'bookingThreads');
const applicationsCol = collection(db, 'photographerApplications');
const adminEventsCol = collection(db, 'adminEvents');
const usersCol = collection(db, 'users');

export type AdminEvent = {
  id?: string;
  type:
    | 'photographer_application'
    | 'booking_requested'
    | 'booking_accepted'
    | 'booking_suggested'
    | 'booking_declined'
    | 'booking_paid';
  title: string;
  body: string;
  threadId?: string | null;
  applicationId?: string | null;
  /** When false or missing, admin bell / inbox treat as unread for photographer-application rows. */
  read?: boolean;
  createdAt?: unknown;
};

export function subscribeRecentThreads(
  cb: (threads: BookingThread[]) => void,
  maxDocs: number = 50,
): Unsubscribe {
  const cap = Math.min(Math.max(maxDocs, 1), 200);
  const q = query(threadsCol, orderBy('updatedAt', 'desc'), limit(cap));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookingThread, 'id'>),
        })),
      ),
    () => cb([]),
  );
}

export function subscribeRecentApplications(
  cb: (apps: PhotographerApplication[]) => void,
): Unsubscribe {
  const q = query(applicationsCol, orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PhotographerApplication, 'id'>),
        })),
      ),
    () => cb([]),
  );
}

export function subscribeAdminEvents(cb: (events: AdminEvent[]) => void): Unsubscribe {
  const q = query(adminEventsCol, orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AdminEvent, 'id'>),
        })),
      ),
    () => cb([]),
  );
}

/** Unread rows in the admin feed (applications + booking lifecycle, for bell / sidebar). */
export function subscribeUnreadAdminEventCount(
  cb: (count: number) => void,
): Unsubscribe {
  return subscribeAdminEvents((events) => {
    cb(events.filter((e) => e.read !== true && e.id).length);
  });
}

export async function markAdminEventRead(eventId: string): Promise<boolean> {
  try {
    await updateDoc(doc(adminEventsCol, eventId), { read: true });
    return true;
  } catch (e) {
    console.error('markAdminEventRead', e);
    return false;
  }
}

/** Mark recent unread admin feed rows read (applications and booking events). */
export async function markAllUnreadAdminEventsRead(): Promise<void> {
  try {
    const q = query(adminEventsCol, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs
        .filter((d) => (d.data() as { read?: boolean }).read !== true)
        .map((d) => updateDoc(d.ref, { read: true })),
    );
  } catch (e) {
    console.warn('markAllUnreadAdminEventsRead', e);
  }
}

export async function markPhotographerAdminEventsReadForApplication(
  applicationId: string,
): Promise<void> {
  try {
    const q = query(
      adminEventsCol,
      where('applicationId', '==', applicationId),
      limit(25),
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) => {
        const data = d.data() as { read?: boolean; type?: string };
        if (data.read === true) return Promise.resolve();
        return updateDoc(d.ref, { read: true });
      }),
    );
  } catch (e) {
    console.warn('markPhotographerAdminEventsReadForApplication', e);
  }
}

export function subscribePhotographerUsers(
  cb: (users: UserData[]) => void,
): Unsubscribe {
  const q = query(usersCol, where('role', '==', 'photographer'), limit(100));
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const data = d.data() as UserData;
          // Ensure stable key even if `uid` field is missing.
          return { ...data, uid: data.uid || d.id };
        }),
      ),
    () => cb([]),
  );
}

/** Admin directory of user profiles (bounded; sort client-side). */
export function subscribeAllUsersForAdmin(
  cb: (users: UserData[]) => void,
): Unsubscribe {
  const q = query(usersCol, limit(500));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as UserData;
        return { ...data, uid: data.uid || d.id };
      });
      rows.sort((a, b) => {
        const ma = millis(a.createdAt);
        const mb = millis(b.createdAt);
        return mb - ma;
      });
      cb(rows);
    },
    () => cb([]),
  );
}

function millis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'object' && v !== null && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (typeof v === 'object' && v !== null && 'seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
    return (v as { seconds: number }).seconds * 1000;
  }
  return 0;
}

export async function getApplicationById(
  id: string,
): Promise<PhotographerApplication | null> {
  const snap = await getDoc(doc(db, 'photographerApplications', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PhotographerApplication, 'id'>) };
}

