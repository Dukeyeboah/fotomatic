'use client';

import type { FocusEventPricing } from '@/lib/photographer-pricing';
import { clampStartingPrice } from '@/lib/photographer-pricing';

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

type Props = {
  startingPrice: number | '';
  onStartingPriceChange: (value: number | '') => void;
  pricingNotes: string;
  onPricingNotesChange: (value: string) => void;
  selectedFocuses: string[];
  eventPricing: FocusEventPricing[];
  onEventPricingChange: (rows: FocusEventPricing[]) => void;
  inputClassName?: string;
  textareaClassName?: string;
  /** Pricing card body: starting price + scrollable specialty prices; notes rendered by parent. */
  compact?: boolean;
};

function DollarInput({
  value,
  onChange,
  placeholder,
  required,
  className,
  inputClassName,
}: {
  value: number | '';
  onChange: (raw: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName: string;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-500">
        $
      </span>
      <input
        inputMode="decimal"
        required={required}
        className={`${inputClassName} pl-7`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />
    </div>
  );
}

export function PhotographerPricingFields({
  startingPrice,
  onStartingPriceChange,
  pricingNotes,
  onPricingNotesChange,
  selectedFocuses,
  eventPricing,
  onEventPricingChange,
  inputClassName = inputClass,
  textareaClassName = inputClass,
  compact = false,
}: Props) {
  const presetFocuses = selectedFocuses.filter((f) => f !== 'Other');

  const rowFor = (focus: string): FocusEventPricing | undefined =>
    eventPricing.find((r) => r.focus === focus);

  const setRowPrice = (focus: string, raw: string) => {
    const v = raw.trim();
    const next = eventPricing.filter((r) => r.focus !== focus);
    if (!v) {
      onEventPricingChange(next);
      return;
    }
    const n = clampStartingPrice(Number(v));
    if (!Number.isFinite(n)) return;
    const prev = rowFor(focus);
    onEventPricingChange([
      ...next,
      { focus, startingPrice: n, notes: prev?.notes },
    ]);
  };

  const setRowNotes = (focus: string, notes: string) => {
    const prev = rowFor(focus);
    if (!prev) {
      onEventPricingChange([
        ...eventPricing.filter((r) => r.focus !== focus),
        { focus, startingPrice: 0, notes },
      ]);
      return;
    }
    onEventPricingChange(
      eventPricing.map((r) =>
        r.focus === focus ? { ...r, notes: notes || undefined } : r,
      ),
    );
  };

  const specialtyBlock =
    presetFocuses.length > 0 ? (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-zinc-700">
            Optional: starting price per specialty
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
            Leave blank to use your default starting price. Add notes for
            possible add-ons (outfit changes, extra locations, larger groups,
            etc.).
          </p>
        </div>
        <ul className="space-y-3">
          {presetFocuses.map((focus) => {
            const row = rowFor(focus);
            return (
              <li
                key={focus}
                className="rounded-xl border border-zinc-200/80 bg-white p-3"
              >
                <p className="text-sm font-semibold text-zinc-900">{focus}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <DollarInput
                    value={
                      row?.startingPrice && row.startingPrice > 0
                        ? row.startingPrice
                        : ''
                    }
                    placeholder="Default"
                    inputClassName={inputClassName}
                    onChange={(v) => setRowPrice(focus, v)}
                  />
                  <input
                    className={inputClassName}
                    placeholder="Notes (optional)"
                    value={row?.notes ?? ''}
                    onChange={(e) => setRowNotes(focus, e.target.value)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    ) : (
      <p className="text-sm text-zinc-500">
        Select specialties above to set optional per-specialty prices.
      </p>
    );

  if (compact) {
    return (
      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-zinc-600">
            Default starting price (USD){' '}
            <span className="font-normal text-zinc-500">*</span>
          </span>
          <DollarInput
            className="max-w-[10rem]"
            value={startingPrice}
            required
            placeholder="500"
            inputClassName={inputClassName}
            onChange={(v) => {
              if (!v) onStartingPriceChange('');
              else onStartingPriceChange(Number(v));
            }}
          />
        </label>
        <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
          {specialtyBlock}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">
          Default starting price (USD){' '}
          <span className="font-normal text-zinc-500">*</span>
        </span>
        <DollarInput
          className="max-w-[10rem]"
          value={startingPrice}
          required
          placeholder="500"
          inputClassName={inputClassName}
          onChange={(v) => {
            if (!v) onStartingPriceChange('');
            else onStartingPriceChange(Number(v));
          }}
        />
      </label>
      {specialtyBlock}
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">
          General pricing notes (optional)
        </span>
        <textarea
          rows={3}
          className={textareaClassName}
          placeholder="Share how pricing works across your shoots (minimums, deposits, typical add-ons)…"
          value={pricingNotes}
          onChange={(e) => onPricingNotesChange(e.target.value)}
        />
      </label>
    </div>
  );
}
