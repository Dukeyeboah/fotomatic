'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  subscribeSupportInboxForAdmin,
  markSupportInboxRead,
  type SupportInboxMessage,
} from '@/lib/firebase/support-inbox';
import { AdminSupportMessageItem } from '@/components/admin/admin-support-message-item';

export default function AdminSupportInboxPage() {
  const [items, setItems] = useState<SupportInboxMessage[]>([]);

  useEffect(() => {
    return subscribeSupportInboxForAdmin(setItems);
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Messages
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Support and contact enquiries. Booking conversations are on the
            Bookings page.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-amber-50/60 p-4 text-sm text-amber-950 shadow-sm">
        <p className="font-semibold text-amber-950">Booking threads</p>
        <p className="mt-1 text-amber-950/90">
          Client ↔ photographer booking requests and replies live under{' '}
          <strong>Bookings</strong> in the admin sidebar (same layout as the rest
          of admin). Open the collapsible thread there to read messages.
        </p>
        <Link
          href="/admin/bookings"
          className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline"
        >
          Open booking threads →
        </Link>
      </div>

      <h2 className="mt-10 font-serif text-lg font-medium text-zinc-900">
        Support & contact
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Submissions from the site contact form and similar enquiries.
      </p>
      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            No messages yet.
          </p>
        ) : (
          items.map((m) => (
            <AdminSupportMessageItem
              key={m.id}
              msg={m}
              onMarkRead={(id) => {
                void markSupportInboxRead(id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
