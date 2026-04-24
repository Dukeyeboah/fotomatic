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

export interface Photographer {
  id?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  website?: string;
  instagram?: string;
  /** Profile or hero image URL for directory cards */
  photoUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  status:
    | 'contacted'
    | 'not-contacted'
    | 'interested-follow-up'
    | 'not-interested/no-response';
  instagramContact: boolean;
  emailContact: boolean;
  phoneContact: boolean;
  name?: string;
  location?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PhotographerBooking {
  id?: string;
  photographerId: string;
  photographerName: string;
  userId: string;
  userName: string;
  userEmail: string;
  status?: 'pending' | 'contacted' | 'completed';
  timestamp?: Timestamp;
}

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
  data: Omit<PhotographerBooking, 'id' | 'timestamp'>,
): Promise<boolean> {
  try {
    const ref = doc(bookingsCollection);
    await setDoc(ref, {
      ...data,
      status: 'pending',
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('bookPhotographer', e);
    return false;
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
  name: string;
  email: string;
  city: string;
  state: string;
  country: string;
  instagram: string;
  website: string;
  portfolioLinks: string;
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
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('savePhotographerApplication', e);
    return false;
  }
}
