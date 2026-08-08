/** Max size allowed by Firebase Storage rules for photographer media. */
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/** Longest edge after client resize (keeps uploads fast to view on the web). */
export const IMAGE_UPLOAD_MAX_EDGE = 2048;

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

/** Detect HEIC/HEIF by file magic (iPhone often uploads HEIC renamed as .jpg). */
export async function blobLooksLikeHeic(blob: Blob): Promise<boolean> {
  const slice = blob.slice(0, 32);
  const buf = new Uint8Array(await slice.arrayBuffer());
  // ISO BMFF: size(4) + 'ftyp' + brand
  if (buf.length < 12) return false;
  const brand = String.fromCharCode(
    buf[8]!,
    buf[9]!,
    buf[10]!,
    buf[11]!,
  );
  if (brand === 'heic' || brand === 'heif' || brand === 'mif1' || brand === 'msf1') {
    return true;
  }
  // Some files put brand later in the ftyp box
  const asText = String.fromCharCode(...buf);
  return /heic|heif|mif1|msf1/i.test(asText);
}

async function convertHeicToJpeg(file: File): Promise<File> {
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

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image for compression.'));
    };
    img.src = url;
  });
}

/**
 * Resize + JPEG-compress so gallery/profile images load quickly.
 * Skips GIF to preserve animation; skips tiny files already under the edge.
 */
async function compressImageFile(
  file: File,
  opts: { maxEdge: number; quality: number },
): Promise<File> {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/gif') return file;

  const img = await loadImageFromBlob(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return file;

  const longest = Math.max(w, h);
  const needsResize = longest > opts.maxEdge;
  const needsReencode =
    needsResize || file.size > 900 * 1024 || !type.includes('jpeg');

  if (!needsReencode) return file;

  const scale = needsResize ? opts.maxEdge / longest : 1;
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', opts.quality),
  );
  if (!blob) return file;

  // Prefer compressed only when it actually helps (or we resized).
  if (!needsResize && blob.size >= file.size * 0.95 && type.includes('jpeg')) {
    return file;
  }

  const base = file.name.replace(/\.[^.]+$/i, '') || 'photo';
  return new File([blob], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export type PrepareImageOptions = {
  maxBytes?: number;
  maxEdge?: number;
  quality?: number;
  /** When false, skip canvas compress (e.g. already cropped/small). */
  compress?: boolean;
};

/**
 * Normalizes uploads for Storage + browser display.
 * HEIC/HEIF (common on iPhones) is converted to JPEG because most browsers cannot render HEIC.
 * Large photos are resized/compressed so profiles and galleries load faster.
 */
export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {},
): Promise<File> {
  const maxBytes = options.maxBytes ?? IMAGE_UPLOAD_MAX_BYTES;
  const maxEdge = options.maxEdge ?? IMAGE_UPLOAD_MAX_EDGE;
  const quality = options.quality ?? 0.82;
  const shouldCompress = options.compress !== false;

  if (!isImageFile(file)) {
    throw new Error('Please choose an image file (JPG, PNG, WebP, or HEIC).');
  }
  if (file.size > maxBytes) {
    throw new Error(
      `Image must be under ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    );
  }

  let next = file;
  const looksHeic = isHeicFile(file) || (await blobLooksLikeHeic(file));
  if (looksHeic) {
    try {
      next = await convertHeicToJpeg(file);
    } catch (e) {
      console.error('HEIC convert failed', e);
      throw new Error(
        'Could not convert this iPhone photo (HEIC). Try exporting as JPEG in Photos, then upload again.',
      );
    }
  } else if (!file.type.startsWith('image/')) {
    const base = file.name.replace(/\.[^.]+$/i, '') || 'photo';
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
      ? ext
      : 'jpg';
    next = new File([file], `${base}.${safeExt}`, {
      type: mimeFromName(file.name),
      lastModified: file.lastModified,
    });
  }

  if (shouldCompress && typeof document !== 'undefined') {
    try {
      next = await compressImageFile(next, { maxEdge, quality });
    } catch (e) {
      console.warn('Image compress skipped', e);
    }
  }

  if (next.size > maxBytes) {
    // Second pass at stronger compression if still over the limit.
    if (shouldCompress && typeof document !== 'undefined') {
      try {
        next = await compressImageFile(next, {
          maxEdge: Math.min(maxEdge, 1600),
          quality: 0.7,
        });
      } catch {
        /* keep */
      }
    }
    if (next.size > maxBytes) {
      throw new Error(
        `Image must be under ${Math.round(maxBytes / (1024 * 1024))}MB after compression. Try a smaller photo.`,
      );
    }
  }

  return next;
}
