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
};

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

  return (
    <div className="space-y-5">
      <label className="block space-y-1">
        <span className="text-xs font-medium text-zinc-600">
          Default starting price (USD){' '}
          <span className="font-normal text-zinc-500">*</span>
        </span>
        <p className="text-[11px] leading-snug text-zinc-500">
          Your general starting price for events. Final quotes may be higher
          depending on the shoot type, outfit or location changes, headcount,
          and other extras.
        </p>
        <input
          inputMode="decimal"
          required
          className={inputClassName}
          placeholder="e.g. 500"
          value={startingPrice}
          onChange={(e) => {
            const v = e.target.value.trim();
            if (!v) onStartingPriceChange('');
            else onStartingPriceChange(Number(v));
          }}
        />
      </label>

      {presetFocuses.length > 0 ? (
        <div className="space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
          <p className="text-xs font-medium text-zinc-700">
            Optional: starting price per specialty
          </p>
          <p className="text-[11px] leading-snug text-zinc-500">
            Leave blank to use your default starting price. Add notes for
            possible add-ons (outfit changes, extra locations, larger groups,
            etc.).
          </p>
          <ul className="space-y-4">
            {presetFocuses.map((focus) => {
              const row = rowFor(focus);
              return (
                <li
                  key={focus}
                  className="rounded-xl border border-zinc-200/80 bg-white p-3"
                >
                  <p className="text-sm font-semibold text-zinc-900">{focus}</p>
                  <label className="mt-2 block space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Starting price (USD)
                    </span>
                    <input
                      inputMode="decimal"
                      className={inputClassName}
                      placeholder="Uses default if empty"
                      value={
                        row?.startingPrice && row.startingPrice > 0
                          ? row.startingPrice
                          : ''
                      }
                      onChange={(e) => setRowPrice(focus, e.target.value)}
                    />
                  </label>
                  <label className="mt-2 block space-y-1">
                    <span className="text-[11px] font-medium text-zinc-500">
                      Notes (optional)
                    </span>
                    <textarea
                      rows={2}
                      className={textareaClassName}
                      placeholder="e.g. +$150 per outfit change, travel fees…"
                      value={row?.notes ?? ''}
                      onChange={(e) => setRowNotes(focus, e.target.value)}
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

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

