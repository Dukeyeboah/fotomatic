'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, ZoomIn, ZoomOut, X } from 'lucide-react';

async function createCroppedFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('Could not load image')));
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not crop image');

  const w = Math.max(1, Math.round(pixelCrop.width));
  const h = Math.max(1, Math.round(pixelCrop.height));
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    w,
    h,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not export image'))),
      'image/jpeg',
      0.92,
    );
  });

  const base = fileName.replace(/\.[^.]+$/i, '') || 'photo';
  return new File([blob], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

type Props = {
  open: boolean;
  imageSrc: string | null;
  fileName?: string;
  /** Crop frame aspect (width / height). Use 1 for avatar. */
  aspect: number;
  title?: string;
  circular?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

export function ImageCropDialog({
  open,
  imageSrc,
  fileName = 'photo.jpg',
  aspect,
  title = 'Adjust image',
  circular = false,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setSaving(false);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, saving, onCancel]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/55 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <button
            type="button"
            aria-label="Close"
            disabled={saving}
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative h-72 w-full bg-zinc-900 sm:h-80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circular ? 'round' : 'rect'}
            showGrid={!circular}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-3 border-t border-zinc-100 px-4 py-4">
          <p className="text-[11px] text-zinc-500">
            Drag to reposition. Use zoom to choose which portion is kept.
          </p>
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-zinc-900"
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-zinc-400" />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !croppedAreaPixels}
              onClick={async () => {
                if (!croppedAreaPixels) return;
                setSaving(true);
                try {
                  const file = await createCroppedFile(
                    imageSrc,
                    croppedAreaPixels,
                    fileName,
                  );
                  await onConfirm(file);
                } catch (e) {
                  console.error(e);
                  setSaving(false);
                  return;
                }
                setSaving(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Use photo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read a File into an object URL for the crop dialog. Caller must revoke. */
export function fileToObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}
