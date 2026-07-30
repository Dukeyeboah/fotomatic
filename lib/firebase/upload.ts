import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { prepareImageForUpload } from '@/lib/prepare-image-upload';
import { storage } from './config';

function safeImageExt(file: File): string {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
}

async function putPreparedImage(
  path: string,
  prepared: File,
): Promise<string | null> {
  try {
    const storageRef = ref(storage, path);
    const contentType = prepared.type?.startsWith('image/')
      ? prepared.type
      : 'image/jpeg';
    await uploadBytes(storageRef, prepared, { contentType });
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.error('putPreparedImage', path, e);
    return null;
  }
}

export async function uploadPhotographerMedia(
  uid: string,
  kind: 'banner' | 'profile',
  file: File,
): Promise<string | null> {
  const prepared = await prepareImageForUpload(file);
  const safeExt = safeImageExt(prepared);
  const path = `photographer-media/${uid}/${kind}-${Date.now()}.${safeExt}`;
  const url = await putPreparedImage(path, prepared);
  if (!url) {
    throw new Error(
      'Upload failed. Check your connection and Storage rules, then try again.',
    );
  }
  return url;
}

/** Public portfolio images; max count enforced in UI and Firestore rules. */
export async function uploadPhotographerGalleryImage(
  uid: string,
  file: File,
): Promise<string | null> {
  const prepared = await prepareImageForUpload(file);
  const safeExt = safeImageExt(prepared);
  const path = `photographer-media/${uid}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
  const url = await putPreparedImage(path, prepared);
  if (!url) {
    throw new Error(
      'Upload failed. Check your connection and Storage rules, then try again.',
    );
  }
  return url;
}

/** Account avatar for clients/admins; same storage path rules as photographer profile uploads. */
export async function uploadUserProfileAvatar(
  uid: string,
  file: File,
): Promise<string | null> {
  return uploadPhotographerMedia(uid, 'profile', file);
}
