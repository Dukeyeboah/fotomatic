'use client';

import { useRef } from 'react';
import { Camera, ImageIcon, Loader2 } from 'lucide-react';

type Props = {
  label: string;
  hint?: string;
  uploading?: boolean;
  disabled?: boolean;
  /** `user` = front/selfie camera on phones; `environment` = rear camera. */
  captureFacing?: 'user' | 'environment';
  multiple?: boolean;
  onPick: (files: FileList | null) => void | Promise<void>;
  children?: React.ReactNode;
  actionsClassName?: string;
};

/**
 * Hidden file inputs + “Take photo” / “Choose image” actions (camera-friendly on mobile).
 */
export function ImageUploadField({
  label,
  hint,
  uploading = false,
  disabled = false,
  captureFacing = 'environment',
  multiple = false,
  onPick,
  children,
  actionsClassName = '',
}: Props) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const pick = (files: FileList | null) => {
    void onPick(files);
  };

  const inputProps = {
    accept: 'image/*,.heic,.heif',
    className: 'sr-only' as const,
    disabled: disabled || uploading,
    multiple,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      pick(e.target.files);
      e.target.value = '';
    },
  };

  const btnClass =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-50 sm:px-4';

  return (
    <div>
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-zinc-500">{hint}</p>
      ) : null}
      {children}
      <input ref={libraryRef} type="file" {...inputProps} />
      <input
        ref={cameraRef}
        type="file"
        {...inputProps}
        capture={captureFacing}
        multiple={false}
      />
      <div
        className={[
          'mt-3 flex flex-wrap items-center gap-2',
          actionsClassName,
        ].join(' ')}
      >
        <button
          type="button"
          className={btnClass}
          disabled={disabled || uploading}
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="h-4 w-4 shrink-0" />
          Take photo
        </button>
        <button
          type="button"
          className={btnClass}
          disabled={disabled || uploading}
          onClick={() => libraryRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          Choose image
        </button>
        {uploading ? (
          <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </span>
        ) : null}
      </div>
    </div>
  );
}
