'use client';

import { SiteHeader } from '@/components/site-header';
import { BookingOrdersList } from '@/components/booking-orders-list';

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <BookingOrdersList
        messagesLinkHref="/messages"
        threadLinkBase="/messages"
        loginRedirectTo="/orders"
      />
    </div>
  );
}

