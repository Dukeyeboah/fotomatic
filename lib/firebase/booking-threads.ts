'use client';

import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';

export type BookingThreadStatus =
  | 'requested'
  | 'accepted_pending_payment'
  | 'confirmed'
  | 'pending_client_response'
  | 'declined'
  | 'expired';

export type BookingThread = {
  id?: string;
  createdAt?: unknown;
  updatedAt?: unknown;

  status: BookingThreadStatus;

  clientUserId: string;
  clientName: string;
  clientEmail: string;

  photographerDirectoryId: string;
  photographerName: string;
  photographerStartingHourlyRate: number;
  /** Set when a photographer account claims a directory id. */
  photographerUserId?: string | null;

  eventType: string;
  /** ISO `YYYY-MM-DD` from calendar picker. */
  eventDate: string;
  /** Optional: time-of-day or flexibility window. */
  eventTimeframe: string;
  duration: string;
  eventLocation: string;
  clientMessage: string;

  agreedToContract: boolean;

  /** Filled when photographer accepts. */
  acceptedHourlyRate?: number | null;
  acceptedTotalPrice?: number | null;

  /** Unread inbound messages (photographer/system) for the client. */
  unreadByClientCount?: number;
  clientLastReadAt?: unknown;
};

export type BookingThreadMessage = {
  id?: string;
  threadId: string;
  senderUserId: string;
  senderRole: 'client' | 'photographer' | 'system';
  text: string;
  createdAt?: unknown;
};

export type AppNotification = {
  id?: string;
  userId: string;
  threadId?: string | null;
  type:
    | 'booking_requested'
    | 'booking_accepted'
    | 'booking_suggested'
    | 'booking_declined'
    | 'new_message'
    | 'system';
  title: string;
  body: string;
  read: boolean;
  createdAt?: unknown;
};

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const threadsCol = collection(db, 'bookingThreads');
const messagesCol = collection(db, 'bookingThreadMessages');
const notificationsCol = collection(db, 'notifications');
const adminEventsCol = collection(db, 'adminEvents');

function firebaseErrMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    if (e.code === 'permission-denied') {
      return 'Firestore blocked this request. Publish the latest `firestore.rules` and try again.';
    }
    if (e.code === 'unavailable') {
      return 'Firestore is temporarily unavailable. Check your connection and try again.';
    }
    return `${e.code}: ${e.message}`;
  }
  return 'Something went wrong. Try again later.';
}

export async function createBookingThread(
  data: Omit<BookingThread, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
    promoNote?: string | null;
  },
): Promise<Result<{ threadId: string }>> {
  try {
    const threadRef = await addDoc(threadsCol, {
      ...data,
      photographerUserId: null,
      status: 'requested',
      unreadByClientCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // System message starting the structured thread
    await addDoc(messagesCol, {
      threadId: threadRef.id,
      senderUserId: 'system',
      senderRole: 'system',
      text: `Booking requested for ${data.eventType} on ${data.eventDate}.`,
      createdAt: serverTimestamp(),
    } satisfies BookingThreadMessage);

    if (data.clientMessage?.trim()) {
      await addDoc(messagesCol, {
        threadId: threadRef.id,
        senderUserId: data.clientUserId,
        senderRole: 'client',
        text: data.clientMessage.trim().slice(0, 8000),
        createdAt: serverTimestamp(),
      } satisfies BookingThreadMessage);
    }

    // Notification for the client (we can't reliably notify photographers yet without claiming directory ids)
    await addDoc(notificationsCol, {
      userId: data.clientUserId,
      threadId: threadRef.id,
      type: 'booking_requested',
      title: 'Booking request sent',
      body: `Request sent for ${data.photographerName}.`,
      read: false,
      createdAt: serverTimestamp(),
    } satisfies AppNotification);

    // Admin event feed
    await addDoc(adminEventsCol, {
      type: 'booking_requested',
      title: 'New booking request',
      body: `${data.clientName} requested ${data.photographerName} (${data.eventType} on ${data.eventDate}).`,
      threadId: threadRef.id,
      applicationId: null,
      createdAt: serverTimestamp(),
    });

    return { ok: true, value: { threadId: threadRef.id } };
  } catch (e) {
    console.error('createBookingThread', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function sendThreadMessage(args: {
  threadId: string;
  senderUserId: string;
  senderRole: 'client' | 'photographer';
  text: string;
}): Promise<Result<true>> {
  try {
    const trimmed = args.text.trim();
    if (!trimmed) return { ok: false, message: 'Message cannot be empty.' };
    await addDoc(messagesCol, {
      threadId: args.threadId,
      senderUserId: args.senderUserId,
      senderRole: args.senderRole,
      text: trimmed.slice(0, 8000),
      createdAt: serverTimestamp(),
    } satisfies BookingThreadMessage);
    await updateDoc(doc(threadsCol, args.threadId), {
      updatedAt: serverTimestamp(),
    });
    if (args.senderRole === 'photographer') {
      try {
        await incrementClientThreadUnread(args.threadId);
      } catch (err) {
        console.warn('incrementClientThreadUnread', err);
      }
    }
    return { ok: true, value: true };
  } catch (e) {
    console.error('sendThreadMessage', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

async function incrementClientThreadUnread(threadId: string): Promise<void> {
  await updateDoc(doc(threadsCol, threadId), {
    unreadByClientCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

/** Client opened the thread — clear unread badge for that booking. */
export async function markThreadReadByClient(
  threadId: string,
): Promise<Result<true>> {
  try {
    await updateDoc(doc(threadsCol, threadId), {
      unreadByClientCount: 0,
      clientLastReadAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true, value: true };
  } catch (e) {
    console.error('markThreadReadByClient', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export function subscribeUnreadNotificationCount(
  userId: string,
  cb: (count: number) => void,
): Unsubscribe {
  // Avoid composite index requirements by filtering client-side.
  const q = query(notificationsCol, where('userId', '==', userId), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      let unread = 0;
      for (const d of snap.docs) {
        const data = d.data() as { read?: boolean };
        if (!data.read) unread++;
      }
      cb(unread);
    },
    (err) => {
      console.error('subscribeUnreadNotificationCount', err);
      cb(0);
    },
  );
}

export function subscribeNotifications(
  userId: string,
  cb: (items: AppNotification[]) => void,
): Unsubscribe {
  // Avoid composite index requirements (where + orderBy). Sort in UI later.
  const q = query(notificationsCol, where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AppNotification, 'id'>),
      }));
      cb(items);
    },
    (err) => {
      console.error('subscribeNotifications', err);
      cb([]);
    },
  );
}

export async function markNotificationsRead(
  notificationIds: string[],
): Promise<Result<true>> {
  try {
    await Promise.all(
      notificationIds.map((id) =>
        updateDoc(doc(notificationsCol, id), { read: true }),
      ),
    );
    return { ok: true, value: true };
  } catch (e) {
    console.error('markNotificationsRead', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export function subscribeThreadsForClient(
  userId: string,
  cb: (threads: BookingThread[]) => void,
): Unsubscribe {
  // Avoid a composite index requirement (where + orderBy) by sorting in UI.
  const q = query(threadsCol, where('clientUserId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookingThread, 'id'>),
        })),
      );
    },
    (err) => {
      console.error('subscribeThreadsForClient', err);
      cb([]);
    },
  );
}

function firestoreCreatedAtMs(value: unknown): number {
  if (value == null) return 0;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds: unknown }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }
  return 0;
}

export function subscribeMessagesForThread(
  threadId: string,
  cb: (messages: BookingThreadMessage[]) => void,
): Unsubscribe {
  // Single-field equality only — avoids composite index (threadId + createdAt).
  const q = query(messagesCol, where('threadId', '==', threadId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BookingThreadMessage, 'id'>),
      }));
      items.sort(
        (a, b) => firestoreCreatedAtMs(a.createdAt) - firestoreCreatedAtMs(b.createdAt),
      );
      cb(items);
    },
    (err) => {
      console.error('subscribeMessagesForThread', err);
      cb([]);
    },
  );
}

export async function claimDirectoryIdForPhotographer(args: {
  photographerUserId: string;
  directoryId: string;
}): Promise<Result<true>> {
  try {
    // Attach photographerUserId to any existing threads for that directory id.
    const q = query(
      threadsCol,
      where('photographerDirectoryId', '==', args.directoryId),
      where('photographerUserId', '==', null),
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(d.ref, {
          photographerUserId: args.photographerUserId,
          updatedAt: serverTimestamp(),
        }),
      ),
    );
    return { ok: true, value: true };
  } catch (e) {
    console.error('claimDirectoryIdForPhotographer', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export function subscribeThreadsForPhotographer(args: {
  photographerUserId: string;
  directoryId?: string | null;
  cb: (threads: BookingThread[]) => void;
}): Unsubscribe {
  if (args.directoryId) {
    const q = query(
      threadsCol,
      where('photographerDirectoryId', '==', args.directoryId),
      orderBy('updatedAt', 'desc'),
    );
    return onSnapshot(
      q,
      (snap) =>
        args.cb(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<BookingThread, 'id'>),
          })),
        ),
      (err) => {
        console.error('subscribeThreadsForPhotographer', err);
        args.cb([]);
      },
    );
  }
  const q = query(
    threadsCol,
    where('photographerUserId', '==', args.photographerUserId),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) =>
      args.cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BookingThread, 'id'>),
        })),
      ),
    (err) => {
      console.error('subscribeThreadsForPhotographer', err);
      args.cb([]);
    },
  );
}

export async function photographerAccept(args: {
  threadId: string;
  photographerUserId: string;
  acceptedHourlyRate: number;
  acceptedTotalPrice: number;
  clientUserId: string;
  photographerName: string;
}): Promise<Result<true>> {
  try {
    await updateDoc(doc(threadsCol, args.threadId), {
      status: 'accepted_pending_payment',
      photographerUserId: args.photographerUserId,
      acceptedHourlyRate: args.acceptedHourlyRate,
      acceptedTotalPrice: args.acceptedTotalPrice,
      updatedAt: serverTimestamp(),
    });
    await addDoc(messagesCol, {
      threadId: args.threadId,
      senderUserId: 'system',
      senderRole: 'system',
      text: `Your booking has been accepted at $${args.acceptedTotalPrice}.`,
      createdAt: serverTimestamp(),
    } satisfies BookingThreadMessage);
    try {
      await incrementClientThreadUnread(args.threadId);
    } catch (e) {
      console.warn('incrementClientThreadUnread', e);
    }
    await addDoc(notificationsCol, {
      userId: args.clientUserId,
      threadId: args.threadId,
      type: 'booking_accepted',
      title: 'Booking accepted',
      body: `${args.photographerName} accepted your booking. Confirm & pay when ready.`,
      read: false,
      createdAt: serverTimestamp(),
    } satisfies AppNotification);
    await addDoc(adminEventsCol, {
      type: 'booking_accepted',
      title: 'Booking accepted',
      body: `${args.photographerName} accepted a booking (thread ${args.threadId}).`,
      threadId: args.threadId,
      applicationId: null,
      createdAt: serverTimestamp(),
    });
    return { ok: true, value: true };
  } catch (e) {
    console.error('photographerAccept', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function photographerSuggestAlternative(args: {
  threadId: string;
  photographerUserId: string;
  clientUserId: string;
  photographerName: string;
  suggestedDate: string;
  suggestedTimeframe: string;
  message: string;
}): Promise<Result<true>> {
  try {
    await updateDoc(doc(threadsCol, args.threadId), {
      status: 'pending_client_response',
      photographerUserId: args.photographerUserId,
      updatedAt: serverTimestamp(),
    });
    const textParts = [
      `Photographer suggested ${args.suggestedDate}`,
      args.suggestedTimeframe ? `(${args.suggestedTimeframe})` : '',
      args.message ? `— ${args.message}` : '',
    ].filter(Boolean);
    await addDoc(messagesCol, {
      threadId: args.threadId,
      senderUserId: 'system',
      senderRole: 'system',
      text: textParts.join(' '),
      createdAt: serverTimestamp(),
    } satisfies BookingThreadMessage);
    try {
      await incrementClientThreadUnread(args.threadId);
    } catch (e) {
      console.warn('incrementClientThreadUnread', e);
    }
    await addDoc(notificationsCol, {
      userId: args.clientUserId,
      threadId: args.threadId,
      type: 'booking_suggested',
      title: 'New time suggested',
      body: `${args.photographerName} suggested a new time for your booking.`,
      read: false,
      createdAt: serverTimestamp(),
    } satisfies AppNotification);
    await addDoc(adminEventsCol, {
      type: 'booking_suggested',
      title: 'Alternative suggested',
      body: `${args.photographerName} suggested a new time (thread ${args.threadId}).`,
      threadId: args.threadId,
      applicationId: null,
      createdAt: serverTimestamp(),
    });
    return { ok: true, value: true };
  } catch (e) {
    console.error('photographerSuggestAlternative', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function photographerDecline(args: {
  threadId: string;
  photographerUserId: string;
  clientUserId: string;
  photographerName: string;
  reason: string;
}): Promise<Result<true>> {
  try {
    await updateDoc(doc(threadsCol, args.threadId), {
      status: 'declined',
      photographerUserId: args.photographerUserId,
      updatedAt: serverTimestamp(),
    });
    await addDoc(messagesCol, {
      threadId: args.threadId,
      senderUserId: 'system',
      senderRole: 'system',
      text: args.reason
        ? `This photographer is unavailable: ${args.reason}`
        : 'This photographer is unavailable for your request.',
      createdAt: serverTimestamp(),
    } satisfies BookingThreadMessage);
    try {
      await incrementClientThreadUnread(args.threadId);
    } catch (e) {
      console.warn('incrementClientThreadUnread', e);
    }
    await addDoc(notificationsCol, {
      userId: args.clientUserId,
      threadId: args.threadId,
      type: 'booking_declined',
      title: 'Booking declined',
      body: `${args.photographerName} declined your booking request.`,
      read: false,
      createdAt: serverTimestamp(),
    } satisfies AppNotification);
    await addDoc(adminEventsCol, {
      type: 'booking_declined',
      title: 'Booking declined',
      body: `${args.photographerName} declined a booking (thread ${args.threadId}).`,
      threadId: args.threadId,
      applicationId: null,
      createdAt: serverTimestamp(),
    });
    return { ok: true, value: true };
  } catch (e) {
    console.error('photographerDecline', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

