import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'photographer';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserData;
}

export async function signInEmailPassword(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user, error: null as string | null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sign in failed';
    return { user: null, error: message };
  }
}

export async function signUpEmailPassword(
  email: string,
  password: string,
  displayName: string,
) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    const userData: UserData = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName || cred.user.displayName,
      photoURL: cred.user.photoURL,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    return { user: cred.user, error: null as string | null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sign up failed';
    return { user: null, error: message };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null as string | null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sign out failed';
    return { error: message };
  }
}

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const u = cred.user;
    const userRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const userData: UserData = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, userData);
    }
    return { user: u, error: null as string | null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Google sign-in failed';
    return { user: null, error: message };
  }
}
