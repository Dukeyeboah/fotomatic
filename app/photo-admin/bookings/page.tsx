'use client';

import { useEffect } from 'react';

/** Legacy URL: `/photo-admin/bookings` → photographer shell inbox. */
export default function PhotoAdminBookingsRedirectPage() {
  useEffect(() => {
    const search = window.location.search ?? '';
    window.location.replace(
      `/photographer/bookings${search ? `${search}` : ''}`,
    );
  }, []);

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-zinc-50 px-4">
      <p className="text-sm text-zinc-600">Opening bookings…</p>
    </div>
  );
}
