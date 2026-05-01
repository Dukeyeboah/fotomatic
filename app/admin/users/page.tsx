'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeAllUsersForAdmin } from '@/lib/firebase/admin';
import type { UserData } from '@/lib/firebase/user-profile';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    return subscribeAllUsersForAdmin(setUsers);
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">Users</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Recent profiles (up to 500). Roles: client, photographer, admin.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">UID</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.uid}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80"
              >
                <td className="px-4 py-3 font-medium text-zinc-900">
                  {u.displayName || u.username || '—'}
                </td>
                <td className="px-4 py-3 text-zinc-600">{u.email || '—'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {u.uid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
