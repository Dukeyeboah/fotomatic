import { redirect } from 'next/navigation';

/** Requests live inside Bookings — keep this URL as a redirect. */
export default function PhotographerRequestsPage() {
  redirect('/photographer/bookings');
}
