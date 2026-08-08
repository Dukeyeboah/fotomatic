'use client';

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
  /** When true, show every specialty as a card (default for public profile). */
  expandAll?: boolean;
  hideTitle?: boolean;
};

export function PhotographerFocusPricingDisplay({
  photographer: p,
  className = '',
  expandAll = false,
  hideTitle = false,
}: Props) {
  const focuses = parsePhotographyFocusesFromFirestore({
    photographyFocuses: p.photographyFocuses,
    photographyFocus: p.photographyFocus,
  });

  if (focuses.length === 0) return null;

  const defaultPrice = directoryStartingPrice(p);

  if (expandAll) {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            {!hideTitle ? (
              <>
                <h3 className="font-serif text-xl font-medium text-zinc-900">
                  Pricing
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Starting prices by specialty · from{' '}
                  <span className="font-semibold text-zinc-800">
                    {formatStartingPriceLabel(defaultPrice)}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-600">
                Starting from{' '}
                <span className="font-semibold text-zinc-800">
                  {formatStartingPriceLabel(defaultPrice)}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {focuses.map((focus) => {
            const price = priceForPhotographyFocus(p, focus);
            const notes = notesForPhotographyFocus(p, focus);
            return (
              <div
                key={focus}
                className="rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-white to-zinc-50/80 p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-zinc-900">{focus}</p>
                <p className="mt-2 font-serif text-2xl font-medium tabular-nums text-zinc-900">
                  {price != null
                    ? `$${price.toLocaleString()}`
                    : formatStartingPriceLabel(defaultPrice)}
                  <span className="ml-1 text-sm font-sans font-normal text-zinc-500">
                    starting
                  </span>
                </p>
                {notes ? (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                    {notes}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">
                    Final price may vary with group size, travel, and extras.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {p.pricingNotes?.trim() ? (
          <div className="mt-5 rounded-2xl border border-amber-200/70 bg-amber-50/50 px-4 py-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
              Pricing notes
            </h4>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {p.pricingNotes.trim()}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // Compact interactive chips (directory modals, etc.)
  return (
    <CompactFocusPricing photographer={p} className={className} />
  );
}

function CompactFocusPricing({
  photographer: p,
  className = '',
}: {
  photographer: DirectoryPhotographer;
  className?: string;
}) {
  const focuses = parsePhotographyFocusesFromFirestore({
    photographyFocuses: p.photographyFocuses,
    photographyFocus: p.photographyFocus,
  });
  // Lazy local state via expand pattern without hooks order issues — use chips with details always visible in compact? Keep simple list.
  return (
    <div className={className}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Photography focus
      </h3>
      <ul className="mt-2 space-y-2">
        {focuses.map((focus) => {
          const price = priceForPhotographyFocus(p, focus);
          const notes = notesForPhotographyFocus(p, focus);
          return (
            <li
              key={focus}
              className="rounded-xl border border-zinc-200 bg-zinc-50/90 px-3 py-2.5 text-sm"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-zinc-900">{focus}</span>
                <span className="shrink-0 tabular-nums font-semibold text-zinc-800">
                  {price != null
                    ? formatStartingPriceLabel(price)
                    : formatStartingPriceLabel(directoryStartingPrice(p))}
                </span>
              </div>
              {notes ? (
                <p className="mt-1 text-xs text-zinc-600">{notes}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
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
