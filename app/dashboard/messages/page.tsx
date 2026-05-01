'use client';

import { Suspense } from 'react';
import { BookingMessagesView } from '@/components/booking-messages-view';
import { Loader2 } from 'lucide-react';

export default function DashboardMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <BookingMessagesView
        ordersLinkHref="/dashboard/bookings"
        loginRedirectTo="/dashboard/messages"
      />
    </Suspense>
  );
}
