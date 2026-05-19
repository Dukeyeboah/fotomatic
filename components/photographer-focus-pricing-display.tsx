'use client';

import { useState } from 'react';
import type { DirectoryPhotographer } from '@/lib/photographers-directory';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';
import {
  formatStartingPriceLabel,
  notesForPhotographyFocus,
  priceForPhotographyFocus,
  directoryStartingPrice,
} from '@/lib/photographer-pricing';

type Props = {
  photographer: DirectoryPhotographer;
  className?: string;
};

export function PhotographerFocusPricingDisplay({
  photographer: p,
  className = '',
}: Props) {
  const focuses = parsePhotographyFocusesFromFirestore({
    photographyFocuses: p.photographyFocuses,
    photographyFocus: p.photographyFocus,
  });
  const [active, setActive] = useState<string | null>(null);

  if (focuses.length === 0) return null;

  const activeFocus = active && focuses.includes(active) ? active : null;
  const activePrice = activeFocus
    ? priceForPhotographyFocus(p, activeFocus)
    : null;
  const activeNotes = activeFocus
    ? notesForPhotographyFocus(p, activeFocus)
    : null;

  return (
    <div className={className}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Photography focus
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {focuses.map((focus) => {
          const price = priceForPhotographyFocus(p, focus);
          const selected = activeFocus === focus;
          return (
            <button
              key={focus}
              type="button"
              onClick={() => setActive(selected ? null : focus)}
              className={[
                'rounded-full border px-3 py-1.5 text-left text-sm font-medium transition-colors',
                selected
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-300 hover:bg-white',
              ].join(' ')}
            >
              <span>{focus}</span>
              {price != null ? (
                <span
                  className={
                    selected ? 'ml-1.5 text-zinc-300' : 'ml-1.5 text-zinc-500'
                  }
                >
                  · {formatStartingPriceLabel(price)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {activeFocus && activePrice != null ? (
        <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-sm text-zinc-800">
          <p className="font-semibold text-zinc-900">{activeFocus}</p>
          <p className="mt-1">
            Starting price:{' '}
            <span className="font-semibold">
              ${activePrice.toLocaleString()}
            </span>
          </p>
          {activeNotes ? (
            <p className="mt-2 whitespace-pre-wrap text-zinc-600">
              {activeNotes}
            </p>
          ) : (
            <p className="mt-2 text-xs text-zinc-500">
              Final price may vary with outfit or location changes, group size,
              and other extras—confirm details when booking.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          Tap a specialty to see starting prices. Default from{' '}
          {formatStartingPriceLabel(directoryStartingPrice(p))}.
        </p>
      )}
      {p.pricingNotes?.trim() ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Pricing notes
          </h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
            {p.pricingNotes.trim()}
          </p>
        </div>
      ) : null}
    </div>
  );
}
