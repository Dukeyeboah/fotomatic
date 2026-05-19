/** Options for photographer specialty / focus (application + profile). */
export const PHOTOGRAPHY_FOCUS_OPTIONS = [
  'Portraits',
  'Weddings & engagements',
  'Graduation & ceremonies',
  'Events & corporate',
  'Family & lifestyle',
  'Fashion & editorial',
  'Product & commercial',
  'Real estate',
  'Landscape & travel',
  'Sports',
  'Other',
] as const;

export type PhotographyFocusOption = (typeof PHOTOGRAPHY_FOCUS_OPTIONS)[number];

const PRESET_SET = new Set<string>(PHOTOGRAPHY_FOCUS_OPTIONS);

const MAX_CUSTOM_FOCUS_LEN = 80;
const MAX_FOCUS_COUNT = 12;

/** Parse `photographyFocuses` array or legacy comma / single `photographyFocus` string. */
export function parsePhotographyFocusesFromFirestore(data: {
  photographyFocuses?: unknown;
  photographyFocus?: unknown;
  style?: unknown;
}): string[] {
  const fromArray = data.photographyFocuses;
  if (Array.isArray(fromArray)) {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of fromArray) {
      if (typeof item !== 'string') continue;
      const t = item.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t.slice(0, MAX_CUSTOM_FOCUS_LEN));
      if (out.length >= MAX_FOCUS_COUNT) break;
    }
    if (out.length > 0) return out;
  }
  const legacy =
    (typeof data.photographyFocus === 'string' ? data.photographyFocus : '') ||
    (typeof data.style === 'string' ? data.style : '');
  const parts = legacy
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];
  return parts.slice(0, MAX_FOCUS_COUNT).map((s) => s.slice(0, MAX_CUSTOM_FOCUS_LEN));
}

/** Comma-separated summary for legacy `photographyFocus` field + admin email. */
export function serializePhotographyFocuses(focuses: string[]): string {
  return focuses
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, MAX_FOCUS_COUNT)
    .join(', ');
}

export function isPresetPhotographyFocus(label: string): boolean {
  return PRESET_SET.has(label.trim());
}

export function togglePhotographyFocus(
  current: string[],
  label: string,
): string[] {
  const t = label.trim();
  if (!t) return current;
  if (current.includes(t)) return current.filter((f) => f !== t);
  if (current.length >= MAX_FOCUS_COUNT) return current;
  return [...current, t];
}

export function resolvePhotographyFocusesFromForm(input: {
  selectedPresets: string[];
  otherText: string;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of input.selectedPresets) {
    const t = p.trim();
    if (!t || t === 'Other' || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  if (input.selectedPresets.includes('Other')) {
    const custom = input.otherText.trim().slice(0, MAX_CUSTOM_FOCUS_LEN);
    if (custom && !seen.has(custom)) out.push(custom);
  }
  return out.slice(0, MAX_FOCUS_COUNT);
}
