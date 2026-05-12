import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

function safeImageExt(file: File): string {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
}

export async function uploadPhotographerMedia(
  uid: string,
  kind: 'banner' | 'profile',
  file: File,
): Promise<string | null> {
  try {
    const safeExt = safeImageExt(file);
    const path = `photographer-media/${uid}/${kind}-${Date.now()}.${safeExt}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type || undefined });
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.error('uploadPhotographerMedia', e);
    return null;
  }
}

/** Public portfolio images; max count enforced in UI and Firestore rules. */
export async function uploadPhotographerGalleryImage(
  uid: string,
  file: File,
): Promise<string | null> {
  try {
    const safeExt = safeImageExt(file);
    const path = `photographer-media/${uid}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type || undefined });
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.error('uploadPhotographerGalleryImage', e);
    return null;
  }
}

/** Account avatar for clients/admins; same storage path rules as photographer profile uploads. */
export async function uploadUserProfileAvatar(
  uid: string,
  file: File,
): Promise<string | null> {
  return uploadPhotographerMedia(uid, 'profile', file);
}
