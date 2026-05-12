import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { firebaseAuthErrorMessage } from '@/lib/firebase/auth-errors';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import {
  ensureUserProfile,
  type UserData,
} from './user-profile';

export type { UserData } from './user-profile';
export { getUserData } from './user-profile';

export async function signInEmailPassword(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      await ensureUserProfile(cred.user);
    } catch (err) {
      console.warn('ensureUserProfile after email sign-in', err);
    }
    return { user: cred.user, error: null as string | null };
  } catch (e: unknown) {
    return { user: null, error: firebaseAuthErrorMessage(e) };
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
    const emailLocal = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9._-]/gi, '') || null;
    const userData: UserData = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: displayName || cred.user.displayName,
      photoURL: cred.user.photoURL,
      username: emailLocal,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), userData);
    return { user: cred.user, error: null as string | null };
  } catch (e: unknown) {
    return { user: null, error: firebaseAuthErrorMessage(e) };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null as string | null };
  } catch (e: unknown) {
    return { error: firebaseAuthErrorMessage(e) };
  }
}

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    try {
      await ensureUserProfile(cred.user);
    } catch (err) {
      console.warn('ensureUserProfile after Google sign-in', err);
    }
    return { user: cred.user, error: null as string | null };
  } catch (e: unknown) {
    return { user: null, error: firebaseAuthErrorMessage(e) };
  }
}
