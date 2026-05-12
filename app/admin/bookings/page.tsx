'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminBookingsInbox } from '@/components/admin/admin-bookings-inbox';

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <AdminBookingsInbox />
    </Suspense>
  );
}
