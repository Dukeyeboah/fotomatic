import type { BookingThread } from '@/lib/firebase/booking-threads';

export type BookingStatusBadge = {
  label: string;
  /** Tailwind classes for pill (background, text, ring) */
  className: string;
};

/** Short label + colors for list rows, thread sidebar, booking cards. */
export function bookingStatusBadge(
  status: BookingThread['status'],
): BookingStatusBadge {
  switch (status) {
    case 'requested':
      return {
        label: 'Requested',
        className: 'bg-amber-100 text-amber-950 ring-amber-200/80',
      };
    case 'pending_client_response':
      return {
        label: 'Pending your response',
        className: 'bg-violet-100 text-violet-950 ring-violet-200/80',
      };
    case 'accepted_pending_payment':
      return {
        label: 'Accepted',
        className: 'bg-emerald-100 text-emerald-950 ring-emerald-200/80',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        className: 'bg-sky-100 text-sky-950 ring-sky-200/80',
      };
    case 'declined':
      return {
        label: 'Declined',
        className: 'bg-red-100 text-red-950 ring-red-200/80',
      };
    case 'expired':
      return {
        label: 'Expired',
        className: 'bg-zinc-200 text-zinc-800 ring-zinc-300/80',
      };
    default:
      return {
        label: String(status),
        className: 'bg-zinc-100 text-zinc-800 ring-zinc-200/80',
      };
  }
}

/** Card/home variant: slightly softer copy for “waiting” states. */
export function bookingStatusBadgeForCard(
  status: BookingThread['status'],
): BookingStatusBadge {
  const base = bookingStatusBadge(status);
  if (status === 'requested' || status === 'pending_client_response') {
    return {
      label:
        status === 'requested' ? 'Awaiting response' : 'Pending your response',
      className: base.className,
    };
  }
  return base;
}
