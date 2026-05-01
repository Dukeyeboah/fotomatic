'use client';

import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { UserData } from '@/lib/firebase/user-profile';

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function firebaseErrMessage(e: unknown): string {
  if (e instanceof FirebaseError) return `${e.code}: ${e.message}`;
  return 'Something went wrong.';
}

export async function adminUpdateUser(
  uid: string,
  patch: Partial<UserData>,
): Promise<Result<true>> {
  try {
    const cleaned = omitUndefinedDeep(patch as Record<string, unknown>);
    await setDoc(
      doc(db, 'users', uid),
      { ...cleaned, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return { ok: true, value: true };
  } catch (e) {
    console.error('adminUpdateUser', e);
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

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

export async function adminApprovePhotographerApplication(args: {
  applicationId: string;
  applicantUserId: string;
  applicantName: string;
}): Promise<Result<true>> {
  try {
    const appSnap = await getDoc(
      doc(db, 'photographerApplications', args.applicationId),
    );
    const app = appSnap.exists() ? appSnap.data() : {};
    const firstName =
      str(app.firstName) ||
      args.applicantName.trim().split(/\s+/).filter(Boolean)[0] ||
      args.applicantName.trim();
    const lastName =
      str(app.lastName) ||
      (args.applicantName.trim().includes(' ')
        ? args.applicantName.trim().split(/\s+/).slice(1).join(' ')
        : '');
    const city = str(app.city);
    const state = str(app.state);
    const country = str(app.country);
    const location =
      city && state ? `${city}, ${state}` : city || state || null;
    const rateRaw = app.startingHourlyRate;
    const startingHourlyRate =
      typeof rateRaw === 'number' && rateRaw > 0
        ? rateRaw
        : typeof rateRaw === 'string'
          ? parseFloat(rateRaw)
          : NaN;
    const rate = Number.isFinite(startingHourlyRate)
      ? Math.min(9999, Math.max(1, startingHourlyRate))
      : 150;

    const directoryId = `p-${args.applicantUserId}`;

    // 1) Promote role + seed photographer profile on user doc
    await setDoc(
      doc(db, 'users', args.applicantUserId),
      {
        role: 'photographer',
        photographer: {
          directoryId,
          hourlyRate: rate,
          city: city || null,
          state: state || null,
          country: country || null,
          bio: str(app.bio) || undefined,
          instagram: str(app.instagram) || undefined,
          website: str(app.website) || undefined,
          twitter: str(app.twitter) || undefined,
          facebook: str(app.facebook) || undefined,
          portfolioUrl: str(app.portfolioLinks) || undefined,
          photographyFocus: str(app.photographyFocus) || undefined,
          serviceArea: str(app.serviceArea) || undefined,
          openToOtherAreas: app.openToOtherAreas === true,
          phone: str(app.phone) || undefined,
          phoneContact: app.phoneContact === true,
          emailContact: app.emailContact === true,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 2) Mark application approved
    await updateDoc(doc(db, 'photographerApplications', args.applicationId), {
      status: 'approved',
      reviewedAt: serverTimestamp(),
    });

    // 3) Notify applicant
    await addDoc(collection(db, 'notifications'), {
      userId: args.applicantUserId,
      threadId: null,
      type: 'system',
      title: 'You’re approved as a photographer',
      body: 'Your application was approved. You can now access /photo-admin to set up your profile.',
      read: false,
      createdAt: serverTimestamp(),
    });

    // 3b) Public directory listing (clients browse this collection)
    const displayName =
      [firstName, lastName].filter(Boolean).join(' ').trim() ||
      args.applicantName.trim();
    await setDoc(
      doc(db, 'photographers', directoryId),
      {
        applicantUserId: args.applicantUserId,
        listed: true,
        status: 'approved',
        firstName,
        lastName: lastName || null,
        name: displayName,
        email: str(app.email) || null,
        website: str(app.website) || null,
        instagram: str(app.instagram) || null,
        twitter: str(app.twitter) || null,
        facebook: str(app.facebook) || null,
        portfolioLinks: str(app.portfolioLinks) || null,
        phone: str(app.phone) || null,
        address: str(app.address) || null,
        city: city || null,
        state: state || null,
        country: country || null,
        location,
        bio: str(app.bio) || null,
        photographyFocus: str(app.photographyFocus) || null,
        serviceArea: str(app.serviceArea) || null,
        openToOtherAreas: app.openToOtherAreas === true,
        phoneContact: app.phoneContact === true,
        emailContact: app.emailContact === true,
        startingHourlyRate: rate,
        photoUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 4) Admin event
    await addDoc(collection(db, 'adminEvents'), {
      type: 'photographer_application',
      title: 'Application approved',
      body: `Approved ${args.applicantName} (${args.applicantUserId}).`,
      threadId: null,
      applicationId: args.applicationId,
      createdAt: serverTimestamp(),
    });

    return { ok: true, value: true };
  } catch (e) {
    console.error('adminApprovePhotographerApplication', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

export async function adminDeclinePhotographerApplication(args: {
  applicationId: string;
  applicantUserId: string;
  applicantName: string;
}): Promise<Result<true>> {
  try {
    await updateDoc(doc(db, 'photographerApplications', args.applicationId), {
      status: 'declined',
      reviewedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'notifications'), {
      userId: args.applicantUserId,
      threadId: null,
      type: 'system',
      title: 'Photographer application update',
      body: 'Thanks for applying. We’re not able to approve your application at this time.',
      read: false,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'adminEvents'), {
      type: 'photographer_application',
      title: 'Application declined',
      body: `Declined ${args.applicantName} (${args.applicantUserId}).`,
      threadId: null,
      applicationId: args.applicationId,
      createdAt: serverTimestamp(),
    });

    return { ok: true, value: true };
  } catch (e) {
    console.error('adminDeclinePhotographerApplication', e);
    return { ok: false, message: firebaseErrMessage(e) };
  }
}

