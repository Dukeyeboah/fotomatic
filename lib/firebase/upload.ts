import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export async function uploadPhotographerMedia(
  uid: string,
  kind: 'banner' | 'profile',
  file: File,
): Promise<string | null> {
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
      ? ext
      : 'jpg';
    const path = `photographer-media/${uid}/${kind}-${Date.now()}.${safeExt}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type || undefined });
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.error('uploadPhotographerMedia', e);
    return null;
  }
}
