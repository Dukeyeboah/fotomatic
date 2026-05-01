'use client';

import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  query,
  updateDoc,
  doc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';

export type SupportInboxSenderRole = 'client' | 'photographer';

export type SupportInboxMessage = {
  id?: string;
  senderUserId: string;
  senderRole: SupportInboxSenderRole;
  senderName: string;
  senderEmail?: string | null;
  /** Optional line shown in admin inbox (contact form). */
  subject?: string | null;
  message: string;
  readByAdmin: boolean;
  createdAt?: unknown;
};

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const col = collection(db, 'supportInbox');

function errMessage(e: unknown): string {
  if (e instanceof FirebaseError) return e.message;
  return 'Something went wrong.';
}

function firestoreMs(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (v && typeof v === 'object' && 'seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
    return (v as { seconds: number }).seconds * 1000;
  }
  return 0;
}

/** Admin: live list of support messages (newest first, client-side sort). */
export function subscribeSupportInboxForAdmin(
  cb: (items: SupportInboxMessage[]) => void,
): Unsubscribe {
  const q = query(col, limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SupportInboxMessage, 'id'>),
      }));
      rows.sort((a, b) => firestoreMs(b.createdAt) - firestoreMs(a.createdAt));
      cb(rows);
    },
    (e) => {
      console.error('subscribeSupportInboxForAdmin', e);
      cb([]);
    },
  );
}

export async function createSupportInboxMessage(args: {
  senderUserId: string;
  senderRole: SupportInboxSenderRole;
  senderName: string;
  senderEmail?: string | null;
  subject?: string | null;
  message: string;
}): Promise<Result<{ id: string }>> {
  try {
    const trimmed = args.message.trim();
    if (!trimmed) return { ok: false, message: 'Message is required.' };
    const subj = args.subject?.trim() ?? '';
    const ref = await addDoc(col, {
      senderUserId: args.senderUserId,
      senderRole: args.senderRole,
      senderName: args.senderName.slice(0, 220),
      senderEmail: args.senderEmail ?? null,
      ...(subj ? { subject: subj.slice(0, 200) } : {}),
      message: trimmed.slice(0, 8000),
      readByAdmin: false,
      createdAt: serverTimestamp(),
    });
    return { ok: true, value: { id: ref.id } };
  } catch (e) {
    console.error('createSupportInboxMessage', e);
    return { ok: false, message: errMessage(e) };
  }
}

export async function markSupportInboxRead(
  messageId: string,
): Promise<Result<true>> {
  try {
    await updateDoc(doc(col, messageId), { readByAdmin: true });
    return { ok: true, value: true };
  } catch (e) {
    console.error('markSupportInboxRead', e);
    return { ok: false, message: errMessage(e) };
  }
}
