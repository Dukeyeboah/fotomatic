/** Max size allowed by Firebase Storage rules for photographer media. */
export const IMAGE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

const HEIC_EXT = /\.(heic|heif)$/i;
const IMAGE_EXT =
  /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif|svg)$/i;

const HEIC_MIME = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

export function isHeicFile(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (HEIC_MIME.has(t)) return true;
  return HEIC_EXT.test(file.name);
}

/** True for common image picks (including HEIC with empty MIME on some phones). */
export function isImageFile(file: File): boolean {
  const t = (file.type || '').toLowerCase();
  if (t.startsWith('image/')) return true;
  return IMAGE_EXT.test(file.name);
}

function mimeFromName(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

/**
 * Normalizes uploads for Storage + browser display.
 * HEIC/HEIF (common on iPhones) is converted to JPEG because most browsers cannot render HEIC.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!isImageFile(file)) {
    throw new Error('Please choose an image file (JPG, PNG, WebP, or HEIC).');
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error('Image must be under 8MB.');
  }

  if (isHeicFile(file)) {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    const blob = Array.isArray(result) ? result[0]! : result;
    const base = file.name.replace(/\.[^.]+$/i, '') || 'photo';
    return new File([blob], `${base}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  }

  if (file.type.startsWith('image/')) return file;

  const base = file.name.replace(/\.[^.]+$/i, '') || 'photo';
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
    ? ext
    : 'jpg';
  return new File([file], `${base}.${safeExt}`, {
    type: mimeFromName(file.name),
    lastModified: file.lastModified,
  });
}
