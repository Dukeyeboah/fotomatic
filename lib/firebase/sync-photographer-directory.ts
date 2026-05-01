'use client';

import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './config';
import type { UserData } from './user-profile';

/**
 * Pushes the photographer’s profile into the public `photographers` collection
 * (doc id `p-{uid}` or their configured `photographer.directoryId`).
 */
export async function syncPhotographerPublicDirectory(
  userData: UserData,
): Promise<boolean> {
  if (userData.role !== 'photographer') return true;
  const uid = userData.uid;
  const ph = userData.photographer ?? {};
  const docId = (ph.directoryId?.trim() || `p-${uid}`).trim();
  if (!docId.startsWith('p-')) return true;

  const city = (ph.city ?? userData.city ?? '').trim();
  const state = (ph.state ?? userData.state ?? '').trim();
  const country = (ph.country ?? userData.country ?? '').trim();
  const location =
    city && state ? `${city}, ${state}` : city || state || country || null;

  const displayName =
    userData.displayName?.trim() ||
    userData.username?.trim() ||
    'Photographer';
  const nameParts = displayName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Photographer';
  const lastName =
    nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

  const rate =
    typeof ph.hourlyRate === 'number' && ph.hourlyRate > 0 ? ph.hourlyRate : 150;

  try {
    await setDoc(
      doc(db, 'photographers', docId),
      {
        applicantUserId: uid,
        listed: true,
        status: 'approved',
        firstName,
        lastName: lastName ?? null,
        name: displayName,
        email: userData.email ?? null,
        city: city || null,
        state: state || null,
        country: country || null,
        location,
        bio: ph.bio ?? null,
        website: ph.website ?? null,
        instagram: ph.instagram ?? null,
        twitter: ph.twitter ?? null,
        facebook: ph.facebook ?? null,
        portfolioLinks: ph.portfolioUrl ?? null,
        photographyFocus: ph.photographyFocus ?? ph.style ?? null,
        serviceArea: ph.serviceArea ?? null,
        openToOtherAreas: ph.openToOtherAreas === true,
        phone: ph.phone ?? null,
        phoneContact: ph.phoneContact === true,
        emailContact: ph.emailContact === true,
        startingHourlyRate: rate,
        photoUrl: ph.profileImageUrl ?? userData.photoURL ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch (e) {
    console.error('syncPhotographerPublicDirectory', e);
    return false;
  }
}
