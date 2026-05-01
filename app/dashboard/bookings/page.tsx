import { BookingOrdersList } from '@/components/booking-orders-list';

export default function DashboardBookingsPage() {
  return (
    <BookingOrdersList
      title="My Bookings"
      subtitle="Your booking history and current status."
      messagesLinkHref="/dashboard/messages"
      threadLinkBase="/dashboard/messages"
      loginRedirectTo="/dashboard/bookings"
    />
  );
}
