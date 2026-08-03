import { Suspense } from 'react';
import { BookingOrdersList } from '@/components/booking-orders-list';
import { Loader2 } from 'lucide-react';

export default function DashboardBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <BookingOrdersList
        title="My Bookings"
        subtitle="Select a photographer on the left to see booking details."
        messagesLinkHref="/dashboard/messages"
        threadLinkBase="/dashboard/messages"
        loginRedirectTo="/dashboard/bookings"
      />
    </Suspense>
  );
}
