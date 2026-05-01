'use client';

import { useState } from 'react';
import { NotificationBell } from '@/components/notification-bell';
import { AdminAccountMenu } from '@/components/admin/admin-account-menu';

const ranges = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
] as const;

export function AdminHeader() {
  const [range, setRange] = useState<(typeof ranges)[number]['id']>('7d');

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900 md:text-3xl">
            Welcome back, Admin 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Here&apos;s an overview of what&apos;s happening on Fotomatic.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <span className="hidden sm:inline">Range</span>
            <select
              value={range}
              onChange={(e) =>
                setRange(e.target.value as (typeof ranges)[number]['id'])
              }
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
            >
              {ranges.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <NotificationBell />
          <AdminAccountMenu />
        </div>
      </div>
    </header>
  );
}
