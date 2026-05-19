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
};

export function PhotographyFocusPicker({
  selected,
  onChange,
  otherText,
  onOtherTextChange,
  required,
  className = '',
}: Props) {
  const showOther = selected.includes('Other');

  return (
    <div className={className}>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-zinc-600">
          Photography focus / specialties
          {required ? <span className="text-red-600"> *</span> : null}
          <span className="mt-0.5 block font-normal text-zinc-500">
            Select all that apply (e.g. graduations, events, portraits).
          </span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PHOTOGRAPHY_FOCUS_OPTIONS.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={[
                  'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                  checked
                    ? 'border-amber-900/30 bg-amber-50/60 text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-zinc-300 text-amber-900 focus:ring-amber-900/30"
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
        {showOther ? (
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
            placeholder="Describe your other specialty"
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
          />
        ) : null}
      </fieldset>
    </div>
  );
}
