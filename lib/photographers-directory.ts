import raw from '@/data/photographers.json';

/** Normalized photographer for the public directory (Firestore + optional JSON seed). */
export type DirectoryPhotographer = {
  id: string;
  source: 'firestore' | 'json';
  firstName: string;
  lastName?: string;
  email?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  /** City / area line */
  city?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  /** Display hourly rate floor for booking flow */
  startingHourlyRate: number;
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

/** Stable placeholder image index `1`…`26` for `dir-*` or Firestore `p-*` ids. */
export function placeholderImageIndexFromDirectoryId(id: string): number {
  const m = /^dir-(\d+)$/.exec(id);
  if (m) {
    const idx = parseInt(m[1]!, 10);
    return (idx % 26) + 1;
  }
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (h % 26) + 1;
}

export function photographerPlaceholderImagePath(id: string): string {
  const n = placeholderImageIndexFromDirectoryId(id);
  return `/photographerImages/${n}.jpg`;
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

    const rates = [150, 200, 250] as const;
    const startingHourlyRate = rates[index % rates.length]!;

    return {
      id: `dir-${index}`,
      source: 'json',
      firstName: first || 'Photographer',
      lastName: last || undefined,
      email: email || undefined,
      website: website || undefined,
      instagram: instagram || undefined,
      city: address || undefined,
      state: state || undefined,
      country: state ? 'United States' : undefined,
      startingHourlyRate,
    };
  });
}

/** Map a public `photographers/{docId}` document to directory shape. */
export function firestoreDocToDirectory(
  docId: string,
  data: Record<string, unknown>,
): DirectoryPhotographer | null {
  if (data.listed === false) return null;
  const firstName =
    str(data.firstName) || str(data.name).split(/\s+/)[0] || 'Photographer';
  const lastNameRaw = str(data.lastName);
  const lastName =
    lastNameRaw ||
    (str(data.name).includes(' ')
      ? str(data.name).split(/\s+/).slice(1).join(' ')
      : undefined);
  const rateRaw = data.startingHourlyRate;
  const rate =
    typeof rateRaw === 'number'
      ? rateRaw
      : typeof rateRaw === 'string'
        ? parseFloat(rateRaw)
        : NaN;
  const startingHourlyRate = Number.isFinite(rate)
    ? Math.min(9999, Math.max(0, rate))
    : 150;

  return {
    id: docId,
    source: 'firestore',
    firstName,
    lastName: lastName || undefined,
    email: data.email != null ? str(data.email) : undefined,
    website: data.website != null ? str(data.website) : undefined,
    instagram: data.instagram != null ? str(data.instagram) : undefined,
    twitter: data.twitter != null ? str(data.twitter) : undefined,
    facebook: data.facebook != null ? str(data.facebook) : undefined,
    city: data.city != null ? str(data.city) : undefined,
    state: data.state != null ? str(data.state) : undefined,
    country: data.country != null ? str(data.country) : undefined,
    photoUrl: data.photoUrl != null ? str(data.photoUrl) : undefined,
    startingHourlyRate,
  };
}
