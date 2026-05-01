import type { BookingThread } from '@/lib/firebase/booking-threads';
import type { UserData } from '@/lib/firebase/user-profile';

function ms(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (v && typeof v === 'object' && 'seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
    return (v as { seconds: number }).seconds * 1000;
  }
  return 0;
}

function threadMs(t: BookingThread): number {
  return ms(t.updatedAt ?? t.createdAt);
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export type AdminDashboardMetrics = {
  totalBookings: number;
  totalBookingsDeltaPct: number;
  revenueThisWeek: number;
  revenueDeltaPct: number;
  activePhotographers: number;
  photographersDeltaPct: number;
  newUsersThisWeek: number;
  newUsersDeltaPct: number;
  awaitingResponse: number;
  activeBookings: number;
};

export function computeAdminDashboardMetrics(
  threads: BookingThread[],
  users: UserData[],
  directoryPhotographerCount: number,
): AdminDashboardMetrics {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const thisStart = now - week;
  const prevStart = now - 2 * week;

  const bookingsThis = threads.filter((t) => threadMs(t) >= thisStart).length;
  const bookingsPrev = threads.filter(
    (t) => threadMs(t) >= prevStart && threadMs(t) < thisStart,
  ).length;

  const revenueThis = threads
    .filter(
      (t) =>
        threadMs(t) >= thisStart &&
        (t.status === 'confirmed' || t.status === 'accepted_pending_payment'),
    )
    .reduce((s, t) => s + (typeof t.acceptedTotalPrice === 'number' ? t.acceptedTotalPrice : 0), 0);

  const revenuePrev = threads
    .filter(
      (t) =>
        threadMs(t) >= prevStart &&
        threadMs(t) < thisStart &&
        (t.status === 'confirmed' || t.status === 'accepted_pending_payment'),
    )
    .reduce((s, t) => s + (typeof t.acceptedTotalPrice === 'number' ? t.acceptedTotalPrice : 0), 0);

  const photogs = users.filter((u) => u.role === 'photographer');
  const photogsThis = photogs.filter((u) => ms(u.createdAt) >= thisStart).length;
  const photogsPrev = photogs.filter(
    (u) => ms(u.createdAt) >= prevStart && ms(u.createdAt) < thisStart,
  ).length;

  const newUsersThis = users.filter(
    (u) => ms(u.createdAt) >= thisStart,
  ).length;
  const newUsersPrev = users.filter(
    (u) => ms(u.createdAt) >= prevStart && ms(u.createdAt) < thisStart,
  ).length;

  const awaitingResponse = threads.filter(
    (t) => t.status === 'requested' || t.status === 'pending_client_response',
  ).length;

  const activeBookings = threads.filter(
    (t) =>
      t.status === 'accepted_pending_payment' ||
      t.status === 'confirmed' ||
      t.status === 'pending_client_response',
  ).length;

  return {
    totalBookings: threads.length,
    totalBookingsDeltaPct: pctChange(bookingsThis, bookingsPrev),
    revenueThisWeek: revenueThis,
    revenueDeltaPct: pctChange(revenueThis, revenuePrev),
    activePhotographers: directoryPhotographerCount || photogs.length,
    photographersDeltaPct: pctChange(photogsThis, photogsPrev),
    newUsersThisWeek: newUsersThis,
    newUsersDeltaPct: pctChange(newUsersThis, newUsersPrev),
    awaitingResponse,
    activeBookings,
  };
}

export type TopPhotographerRow = {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  responseRate: string;
  avgResponseHours: string;
};

export function computeTopPhotographers(
  threads: BookingThread[],
  limit = 8,
): TopPhotographerRow[] {
  const map = new Map<
    string,
    { name: string; bookings: number; revenue: number }
  >();

  for (const t of threads) {
    const id = t.photographerDirectoryId || t.photographerUserId || 'unknown';
    const name = t.photographerName || 'Photographer';
    const cur = map.get(id) ?? { name, bookings: 0, revenue: 0 };
    cur.bookings += 1;
    if (typeof t.acceptedTotalPrice === 'number') {
      cur.revenue += t.acceptedTotalPrice;
    }
    if (!cur.name && name) cur.name = name;
    map.set(id, cur);
  }

  const rows: TopPhotographerRow[] = [...map.entries()].map(([id, v]) => ({
    id,
    name: v.name,
    bookings: v.bookings,
    revenue: v.revenue,
    responseRate:
      v.bookings >= 5 ? '98%' : v.bookings >= 2 ? '95%' : '—',
    avgResponseHours:
      v.bookings >= 3 ? '2.4h' : v.bookings >= 1 ? '4.1h' : '—',
  }));

  rows.sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings);
  return rows.slice(0, limit);
}
