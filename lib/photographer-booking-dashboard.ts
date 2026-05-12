import type { BookingThread } from '@/lib/firebase/booking-threads';
import { photographerPlaceholderImagePath } from '@/lib/photographers-directory';

export type ActivityFeedIcon =
  | 'inbox'
  | 'calendar'
  | 'credit'
  | 'star'
  | 'message';

export type PhotographerActivityFeedItem = {
  id: string;
  message: string;
  timeLabel: string;
  icon: ActivityFeedIcon;
};

/** Default directory document id used in `photographers` and booking threads. */
export function effectivePhotographerDirectoryId(
  authUid: string,
  configuredDirectoryId: string | null | undefined,
): string {
  const t = configuredDirectoryId?.trim();
  return t || `p-${authUid}`;
}

export function countOpenBookingRequests(threads: BookingThread[]): number {
  return threads.filter((t) => t.status === 'requested').length;
}

export function countActiveUpcomingBookings(threads: BookingThread[]): number {
  return threads.filter((t) =>
    ['accepted_pending_payment', 'confirmed', 'pending_client_response'].includes(
      t.status,
    ),
  ).length;
}

function firestoreMs(v: unknown): number {
  if (v == null) return 0;
  if (
    typeof v === 'object' &&
    v !== null &&
    'toMillis' in v &&
    typeof (v as { toMillis: unknown }).toMillis === 'function'
  ) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (
    typeof v === 'object' &&
    v !== null &&
    'seconds' in v &&
    typeof (v as { seconds: unknown }).seconds === 'number'
  ) {
    return (v as { seconds: number }).seconds * 1000;
  }
  return 0;
}

function formatRelativeTime(ms: number): string {
  const d = Math.max(0, Date.now() - ms);
  if (d < 60_000) return 'Just now';
  if (d < 3600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86400_000) return `${Math.floor(d / 3600_000)}h ago`;
  if (d < 172800_000) return 'Yesterday';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function statusVerb(status: BookingThread['status']): string {
  switch (status) {
    case 'requested':
      return 'requested a booking';
    case 'accepted_pending_payment':
      return 'accepted — awaiting payment';
    case 'confirmed':
      return 'confirmed';
    case 'pending_client_response':
      return 'suggested a new time';
    case 'declined':
      return 'declined';
    case 'expired':
      return 'expired';
    default:
      return 'updated';
  }
}

/** Recent items for the photographer dashboard activity list (from threads). */
export function threadsToActivityFeedItems(
  threads: BookingThread[],
  maxItems = 8,
): PhotographerActivityFeedItem[] {
  const sorted = [...threads].sort(
    (a, b) =>
      firestoreMs(b.updatedAt ?? b.createdAt) -
      firestoreMs(a.updatedAt ?? a.createdAt),
  );
  const out: PhotographerActivityFeedItem[] = [];
  for (const t of sorted) {
    if (!t.id) continue;
    const ms = firestoreMs(t.updatedAt ?? t.createdAt);
    const icon: ActivityFeedIcon =
      t.status === 'requested'
        ? 'inbox'
        : t.status === 'pending_client_response'
          ? 'calendar'
          : t.status === 'accepted_pending_payment'
            ? 'credit'
            : 'message';
    out.push({
      id: t.id,
      message: `${t.clientName} — ${statusVerb(t.status)}`,
      timeLabel: formatRelativeTime(ms),
      icon,
    });
    if (out.length >= maxItems) break;
  }
  return out;
}

export function formatThreadDateDisplay(isoDate: string): string {
  const raw = isoDate?.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw || '—';
  const [y, m, d] = raw.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function clientBookingAvatarUrl(thread: {
  clientPhotoURL?: string | null;
}): string | null {
  const u = thread.clientPhotoURL?.trim();
  if (u && /^https?:\/\//i.test(u)) return u;
  return null;
}

/** @deprecated Use clientBookingAvatarUrl + User icon fallback in UI */
export function clientAvatarForThread(thread: { clientUserId: string }): string {
  return photographerPlaceholderImagePath(`c-${thread.clientUserId}`);
}

/** Earnings from accepted / confirmed threads this calendar month (approximation). */
function earningsInMonth(
  threads: BookingThread[],
  year: number,
  monthIndex: number,
): number {
  let sum = 0;
  for (const t of threads) {
    if (
      t.status !== 'accepted_pending_payment' &&
      t.status !== 'confirmed' &&
      t.status !== 'pending_client_response'
    ) {
      continue;
    }
    const price =
      typeof t.acceptedTotalPrice === 'number' ? t.acceptedTotalPrice : 0;
    if (price <= 0) continue;
    const ms = firestoreMs(t.updatedAt ?? t.createdAt);
    if (!ms) continue;
    const d = new Date(ms);
    if (d.getFullYear() === year && d.getMonth() === monthIndex) sum += price;
  }
  return Math.round(sum);
}

export function earningsThisMonthFromThreads(threads: BookingThread[]): number {
  const now = new Date();
  return earningsInMonth(threads, now.getFullYear(), now.getMonth());
}

/** Month-over-month % change from accepted totals (0 if no prior month). */
export function earningsMonthOverMonthDeltaPct(threads: BookingThread[]): number {
  const now = new Date();
  const cur = earningsInMonth(threads, now.getFullYear(), now.getMonth());
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = earningsInMonth(threads, prevD.getFullYear(), prevD.getMonth());
  if (prev <= 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export function lifetimeEarningsFromThreads(threads: BookingThread[]): number {
  let sum = 0;
  for (const t of threads) {
    if (
      t.status !== 'accepted_pending_payment' &&
      t.status !== 'confirmed' &&
      t.status !== 'pending_client_response'
    ) {
      continue;
    }
    const price =
      typeof t.acceptedTotalPrice === 'number' ? t.acceptedTotalPrice : 0;
    if (price > 0) sum += price;
  }
  return Math.round(sum);
}

/** 12 points (oldest → newest month) normalized 0–1 for a simple sparkline. */
export function earningsChartPointsFromThreads(
  threads: BookingThread[],
): number[] {
  const buckets = Array.from({ length: 12 }, () => 0);
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    for (const t of threads) {
      if (
        t.status !== 'accepted_pending_payment' &&
        t.status !== 'confirmed' &&
        t.status !== 'pending_client_response'
      ) {
        continue;
      }
      const price =
        typeof t.acceptedTotalPrice === 'number' ? t.acceptedTotalPrice : 0;
      if (price <= 0) continue;
      const ms = firestoreMs(t.updatedAt ?? t.createdAt);
      if (!ms) continue;
      const td = new Date(ms);
      if (td.getFullYear() === y && td.getMonth() === m) buckets[i] += price;
    }
  }
  const max = Math.max(...buckets, 1);
  return buckets.map((v) => Math.min(1, v / max));
}
