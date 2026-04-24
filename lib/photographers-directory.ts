import raw from '@/data/photographers.json';

/** Normalized photographer for the public directory (from `data/photographers.json`). */
export type DirectoryPhotographer = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  website?: string;
  instagram?: string;
  /** City / area line from source `Address` field */
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
};

type JsonRow = Record<string, string | boolean | undefined>;

function str(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

function titleCaseWords(s: string): string {
  if (!s) return '';
  return s
    .split(/\s+/)
    .map((w) =>
      w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(' ');
}

/**
 * Maps spreadsheet-style JSON rows to directory entries. IDs are stable (`dir-0`, `dir-1`, …)
 * for booking requests keyed off list order.
 */
export function getDirectoryPhotographers(): DirectoryPhotographer[] {
  const rows = raw as JsonRow[];
  return rows.map((row, index) => {
    const first = str(row['First Name']);
    const last = str(row['Last Name']);
    const stateRaw = str(row['State']);
    const address = str(row['Address']);
    const website = str(row['Website']);
    const instagram = str(row['Instagram']);
    const email = str(row['Email']);
    const state = stateRaw.length > 0 ? titleCaseWords(stateRaw) : '';

    return {
      id: `dir-${index}`,
      firstName: first || 'Photographer',
      lastName: last || undefined,
      email: email || undefined,
      website: website || undefined,
      instagram: instagram || undefined,
      city: address || undefined,
      state: state || undefined,
      country: state ? 'United States' : undefined,
    };
  });
}
