import type { BookingThread } from '@/lib/firebase/booking-threads';

export type ClientBookingStats = {
  pendingResponses: number;
  acceptedPendingPayment: number;
  confirmedUpcoming: number;
  pastBookings: number;
};

function eventDatePassed(eventDate: string): boolean {
  const d = new Date(`${eventDate}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d < new Date();
}

/** Derive dashboard stat counts from the current user’s booking threads. */
export function computeClientBookingStats(
  threads: BookingThread[],
): ClientBookingStats {
  let pendingResponses = 0;
  let acceptedPendingPayment = 0;
  let confirmedUpcoming = 0;
  let pastBookings = 0;

  for (const t of threads) {
    if (t.status === 'requested' || t.status === 'pending_client_response') {
      pendingResponses++;
    } else if (t.status === 'accepted_pending_payment') {
      acceptedPendingPayment++;
    } else if (t.status === 'confirmed') {
      if (t.eventDate && eventDatePassed(t.eventDate)) {
        pastBookings++;
      } else {
        confirmedUpcoming++;
      }
    } else if (t.status === 'declined' || t.status === 'expired') {
      pastBookings++;
    }
  }

  return {
    pendingResponses,
    acceptedPendingPayment,
    confirmedUpcoming,
    pastBookings,
  };
}
