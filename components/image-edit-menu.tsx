'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImageIcon, Loader2, Pencil } from 'lucide-react';

type Props = {
  uploading?: boolean;
  disabled?: boolean;
  /** `user` = front camera; `environment` = rear. */
  captureFacing?: 'user' | 'environment';
  multiple?: boolean;
  /** When false, only opens the photo library (no Take photo). */
  allowCamera?: boolean;
  onPick: (files: FileList | null) => void | Promise<void>;
  className?: string;
  /** Accessible label for the edit trigger. */
  label?: string;
};

/**
 * Pencil control that opens Take photo / Upload image (or upload-only).
 * Camera and library use separate file inputs so “Upload” always opens the library.
 */
export function ImageEditMenu({
  uploading = false,
  disabled = false,
  captureFacing = 'environment',
  multiple = false,
  allowCamera = true,
  onPick,
  className = '',
  label = 'Edit image',
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (files: FileList | null) => {
    setOpen(false);
    void onPick(files);
  };

  const openLibrary = () => {
    libraryRef.current?.click();
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        ref={libraryRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="sr-only"
        disabled={disabled || uploading}
        multiple={multiple}
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
      {allowCamera ? (
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || uploading}
          capture={captureFacing}
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = '';
          }}
        />
      ) : null}
      <button
        type="button"
        aria-label={label}
        aria-expanded={allowCamera ? open : undefined}
        disabled={disabled || uploading}
        onClick={() => {
          if (!allowCamera) {
            openLibrary();
            return;
          }
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/85 text-white shadow-md ring-2 ring-white/90 hover:bg-zinc-900 disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
      {allowCamera && open ? (
        <div className="absolute right-0 z-30 mt-1.5 min-w-[10.5rem] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="h-4 w-4 shrink-0 text-zinc-500" />
            Take photo
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={openLibrary}
          >
            <ImageIcon className="h-4 w-4 shrink-0 text-zinc-500" />
            Upload image
          </button>
        </div>
      ) : null}
    </div>
  );
}
