import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { addDoc } from 'firebase/firestore';

export interface Photographer {
  id?: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  /** Profile or hero image URL for directory cards */
  photoUrl?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  status:
    | 'contacted'
    | 'not-contacted'
    | 'interested-follow-up'
    | 'not-interested/no-response';
  instagramContact: boolean;
  emailContact: boolean;
  phoneContact: boolean;
  name?: string | null;
  location?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PhotographerBooking {
  id?: string;
  photographerId: string;
  photographerName: string;
  photographerStartingHourlyRate: number;
  userId: string;
  userName: string;
  userEmail: string;
  eventType: string;
  eventLocation: string;
  duration: string;
  /** ISO `YYYY-MM-DD` or user-entered date text */
  eventDate: string;
  notes: string;
  /** Client accepted standard contract terms at request time. */
  agreedToContract: boolean;
  /** Optional referral / promo line from landing links */
  promoNote?: string;
  status?: 'requested' | 'accepted_pending_payment' | 'confirmed' | 'pending_client_response' | 'declined';
  timestamp?: Timestamp;
}

export type BookPhotographerResult =
  | { ok: true }
  | { ok: false; message: string };

const photographersCollection = collection(db, 'photographers');
const bookingsCollection = collection(db, 'photographerBookings');

export async function getPhotographers(
  statusFilter?: string,
): Promise<Photographer[]> {
  try {
    let q;
    if (statusFilter) {
      try {
        q = query(
          photographersCollection,
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc'),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Photographer[];
      } catch {
        q = query(
          photographersCollection,
          where('status', '==', statusFilter),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Photographer[];
      }
    }
    const snapshot = await getDocs(photographersCollection);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Photographer[];
  } catch (e) {
    console.error('getPhotographers', e);
    return [];
  }
}

export async function bookPhotographer(
  data: Omit<PhotographerBooking, 'id' | 'timestamp' | 'status'>,
): Promise<BookPhotographerResult> {
  try {
    const ref = doc(bookingsCollection);
    const payload: Record<string, unknown> = {
      photographerId: data.photographerId,
      photographerName: data.photographerName,
      photographerStartingHourlyRate: data.photographerStartingHourlyRate,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      eventType: data.eventType,
      eventLocation: data.eventLocation,
      duration: data.duration,
      eventDate: data.eventDate,
      notes: data.notes,
      agreedToContract: data.agreedToContract,
      status: 'requested',
      timestamp: serverTimestamp(),
    };
    if (data.promoNote !== undefined && data.promoNote !== '') {
      payload.promoNote = data.promoNote;
    }
    await setDoc(ref, payload);
    return { ok: true };
  } catch (e) {
    console.error('bookPhotographer', e);
    if (e instanceof FirebaseError) {
      if (e.code === 'permission-denied') {
        return {
          ok: false,
          message:
            'Firestore blocked this request. Deploy the latest `firestore.rules` in Firebase (same project as your app keys) and try again.',
        };
      }
      if (e.code === 'unavailable') {
        return {
          ok: false,
          message:
            'Firestore is temporarily unavailable. Check your network and try again.',
        };
      }
      return { ok: false, message: `${e.code}: ${e.message}` };
    }
    return {
      ok: false,
      message: 'Could not send booking. Try again later.',
    };
  }
}

/** Optional: newsletter signups from the landing page */
export async function saveNewsletterLead(email: string): Promise<boolean> {
  try {
    const ref = doc(collection(db, 'fotomaticNewsletterLeads'));
    await setDoc(ref, {
      email: email.trim().toLowerCase(),
      source: 'fotomatic',
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('saveNewsletterLead', e);
    return false;
  }
}

export interface PhotographerApplicationInput {
  applicantUserId: string;
  /** Combined display name for admin / email templates */
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
  country: string;
  address: string;
  startingHourlyRate: number;
  bio: string;
  photographyFocus: string;
  phone: string;
  phoneContact: boolean;
  emailContact: boolean;
  instagram: string;
  twitter: string;
  facebook: string;
  website: string;
  portfolioLinks: string;
  serviceArea: string;
  openToOtherAreas: boolean;
  interestedInClientWork: boolean;
  howDidYouHear: string;
}

export async function savePhotographerApplication(
  data: PhotographerApplicationInput,
): Promise<boolean> {
  try {
    const ref = doc(collection(db, 'photographerApplications'));
    await setDoc(ref, {
      ...data,
      source: 'fotomatic',
      status: 'submitted',
      createdAt: serverTimestamp(),
    });
    // Admin event feed (readable by admin dashboard)
    try {
      await addDoc(collection(db, 'adminEvents'), {
        type: 'photographer_application',
        title: 'New photographer application',
        body: `${data.name} applied (${data.city}, ${data.country}).`,
        threadId: null,
        applicationId: ref.id,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // Don't block applications if adminEvents is not writable for this user.
      console.warn('[savePhotographerApplication] adminEvents write failed', e);
    }
    return true;
  } catch (e) {
    console.error('savePhotographerApplication', e);
    return false;
  }
}
