'use client';

import { NotificationBell } from '@/components/notification-bell';
import { AdminAccountMenu } from '@/components/admin/admin-account-menu';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:px-6 sm:py-4">
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-xl font-medium text-zinc-900 sm:text-2xl md:text-3xl">
            Admin
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <NotificationBell />
          <AdminAccountMenu />
        </div>
      </div>
    </header>
  );
}
