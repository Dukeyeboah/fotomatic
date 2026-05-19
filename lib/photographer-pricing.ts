import type { DirectoryPhotographer } from '@/lib/photographers-directory';

/** Per–focus-area starting price and optional notes (extras, outfit changes, etc.). */
export type FocusEventPricing = {
  focus: string;
  startingPrice: number;
  notes?: string;
};

const MAX_FOCUS_PRICING_ROWS = 12;
const MAX_PRICING_NOTES_LEN = 2000;
const MAX_ROW_NOTES_LEN = 800;

export function clampStartingPrice(n: number): number {
  if (!Number.isFinite(n)) return NaN;
  return Math.min(9999, Math.max(1, Math.round(n)));
}

/** General pricing notes shown on the public profile (extras, add-ons, etc.). */
export function sanitizePricingNotes(raw: string | undefined | null): string {
  return (raw ?? '').trim().slice(0, MAX_PRICING_NOTES_LEN);
}

export function sanitizeEventPricingRows(
  rows: FocusEventPricing[],
  allowedFocuses: readonly string[],
): FocusEventPricing[] {
  const allowed = new Set(allowedFocuses);
  const out: FocusEventPricing[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const focus = row.focus.trim();
    if (!focus || !allowed.has(focus) || seen.has(focus)) continue;
    const startingPrice = clampStartingPrice(row.startingPrice);
    if (!Number.isFinite(startingPrice)) continue;
    const notes = (row.notes ?? '').trim().slice(0, MAX_ROW_NOTES_LEN);
    out.push({
      focus,
      startingPrice,
      ...(notes ? { notes } : {}),
    });
    seen.add(focus);
    if (out.length >= MAX_FOCUS_PRICING_ROWS) break;
  }
  return out;
}

export function parseEventPricingFromFirestore(
  raw: unknown,
): FocusEventPricing[] {
  if (!Array.isArray(raw)) return [];
  const out: FocusEventPricing[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const focus = typeof o.focus === 'string' ? o.focus.trim() : '';
    const priceRaw = o.startingPrice;
    const startingPrice =
      typeof priceRaw === 'number'
        ? priceRaw
        : typeof priceRaw === 'string'
          ? parseFloat(priceRaw)
          : NaN;
    if (!focus || !Number.isFinite(startingPrice)) continue;
    const notes =
      typeof o.notes === 'string' ? o.notes.trim().slice(0, MAX_ROW_NOTES_LEN) : '';
    out.push({
      focus,
      startingPrice: clampStartingPrice(startingPrice),
      ...(notes ? { notes } : {}),
    });
  }
  return out;
}

/** Lowest display price for directory cards (general or per-focus). */
export function directoryStartingPrice(p: {
  startingPrice?: number;
  startingHourlyRate?: number;
  eventPricing?: FocusEventPricing[];
}): number {
  const general =
    typeof p.startingPrice === 'number' && p.startingPrice > 0
      ? p.startingPrice
      : typeof p.startingHourlyRate === 'number' && p.startingHourlyRate > 0
        ? p.startingHourlyRate
        : NaN;
  const fromRows = (p.eventPricing ?? [])
    .map((r) => r.startingPrice)
    .filter((n) => Number.isFinite(n) && n > 0);
  const candidates = [
    ...(Number.isFinite(general) ? [general] : []),
    ...fromRows,
  ];
  if (candidates.length === 0) return 150;
  return Math.min(...candidates);
}

export function formatStartingPriceLabel(amount: number): string {
  return `From $${amount}`;
}

export function formatDirectoryStartingPrice(p: DirectoryPhotographer): string {
  return formatStartingPriceLabel(directoryStartingPrice(p));
}

export function priceForPhotographyFocus(
  p: Pick<DirectoryPhotographer, 'startingPrice' | 'startingHourlyRate' | 'eventPricing'>,
  focus: string,
): number | null {
  const key = focus.trim();
  if (!key) return null;
  const row = (p.eventPricing ?? []).find((r) => r.focus === key);
  if (row && Number.isFinite(row.startingPrice)) return row.startingPrice;
  const general =
    typeof p.startingPrice === 'number' && p.startingPrice > 0
      ? p.startingPrice
      : typeof p.startingHourlyRate === 'number' && p.startingHourlyRate > 0
        ? p.startingHourlyRate
        : null;
  return general;
}

export function notesForPhotographyFocus(
  p: Pick<DirectoryPhotographer, 'eventPricing'>,
  focus: string,
): string | null {
  const row = (p.eventPricing ?? []).find((r) => r.focus === focus.trim());
  return row?.notes?.trim() || null;
}

/** Map booking event type labels to directory focus labels when possible. */
const BOOKING_EVENT_TO_FOCUS: Record<string, string> = {
  Graduation: 'Graduation & ceremonies',
  Wedding: 'Weddings & engagements',
  Engagement: 'Weddings & engagements',
  'Portrait session': 'Portraits',
  'Corporate / headshots': 'Events & corporate',
  'Event coverage': 'Events & corporate',
  'Fashion / editorial': 'Fashion & editorial',
  Product: 'Product & commercial',
  Family: 'Family & lifestyle',
};

export function focusLabelForBookingEventType(eventType: string): string | null {
  return BOOKING_EVENT_TO_FOCUS[eventType.trim()] ?? null;
}

export function priceForBookingEventType(
  p: Pick<
    DirectoryPhotographer,
    'startingPrice' | 'startingHourlyRate' | 'eventPricing'
  >,
  eventType: string,
): number {
  const mapped = focusLabelForBookingEventType(eventType);
  if (mapped) {
    const specific = priceForPhotographyFocus(p, mapped);
    if (specific != null) return specific;
  }
  return directoryStartingPrice(p);
}
