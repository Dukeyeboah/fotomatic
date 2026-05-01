'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
            Support inbox
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Messages from clients and photographers. Ticket workflow can extend
            this collection.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
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
