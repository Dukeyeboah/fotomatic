'use client';

import {
  PHOTOGRAPHY_FOCUS_OPTIONS,
  togglePhotographyFocus,
} from '@/lib/photography-focus';

type Props = {
  selected: string[];
  onChange: (next: string[]) => void;
  otherText: string;
  onOtherTextChange: (value: string) => void;
  required?: boolean;
  className?: string;
  /** Match bio textarea height when true. */
  fillHeight?: boolean;
};

export function PhotographyFocusPicker({
  selected,
  onChange,
  otherText,
  onOtherTextChange,
  required,
  className = '',
  fillHeight = false,
}: Props) {
  const showOther = selected.includes('Other');

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <p className="text-xs font-medium text-zinc-600">
        Photography focus / specialties
        {required ? <span className="text-red-600"> *</span> : null}
      </p>
      <div
        className={[
          'mt-1 flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white',
          fillHeight ? 'flex-1' : 'max-h-56',
        ].join(' ')}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5" role="group">
          <div className="space-y-0.5">
            {PHOTOGRAPHY_FOCUS_OPTIONS.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className={[
                    'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                    checked
                      ? 'bg-amber-50 text-zinc-900'
                      : 'text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
                    checked={checked}
                    onChange={() =>
                      onChange(togglePhotographyFocus(selected, opt))
                    }
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
        {showOther ? (
          <div className="shrink-0 border-t border-zinc-100 p-2">
            <input
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
              placeholder="Describe your other specialty"
              value={otherText}
              onChange={(e) => onOtherTextChange(e.target.value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
