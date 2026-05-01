'use client';

import { Suspense } from 'react';
import { SiteHeader } from '@/components/site-header';
import { BookingMessagesView } from '@/components/booking-messages-view';
import { Loader2 } from 'lucide-react';

function MessagesWithHeader() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <BookingMessagesView
        ordersLinkHref="/orders"
        loginRedirectTo="/messages"
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50">
          <SiteHeader />
          <div className="mx-auto flex max-w-6xl justify-center px-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        </div>
      }
    >
      <MessagesWithHeader />
    </Suspense>
  );
}

