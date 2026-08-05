'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleUserRound, LayoutGrid, List } from 'lucide-react';
import { subscribeAllUsersForAdmin } from '@/lib/firebase/admin';
import type { UserData } from '@/lib/firebase/user-profile';

type RoleFilter = 'all' | 'admin' | 'photographer' | 'user';
type ViewMode = 'grid' | 'list';

const FILTERS: ReadonlyArray<{ id: RoleFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'admin', label: 'Admins' },
  { id: 'photographer', label: 'Photographers' },
  { id: 'user', label: 'Users' },
];

function roleBadgeClass(role: UserData['role']): string {
  if (role === 'admin') return 'bg-violet-100 text-violet-900';
  if (role === 'photographer') return 'bg-amber-100 text-amber-950';
  return 'bg-zinc-100 text-zinc-700';
}

function roleLabel(role: UserData['role']): string {
  if (role === 'admin') return 'Admin';
  if (role === 'photographer') return 'Photographer';
  return 'User';
}

function Avatar({ user }: { user: UserData }) {
  const url =
    user.photoURL?.trim() ||
    user.photographer?.profileImageUrl?.trim() ||
    '';
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
      <CircleUserRound className="h-1/2 w-1/2" strokeWidth={1.5} />
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');

  useEffect(() => {
    return subscribeAllUsersForAdmin(setUsers);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      photographer: users.filter((u) => u.role === 'photographer').length,
      user: users.filter((u) => u.role === 'user').length,
    };
  }, [users]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Users
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {filtered.length} of {users.length} profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setView('grid')}
              className={`rounded-md p-2 transition ${
                view === 'grid'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setView('list')}
              className={`rounded-md p-2 transition ${
                view === 'list'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <List className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <Link
            href="/admin"
            className="text-sm font-semibold text-amber-900 hover:underline"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-zinc-200/90 pb-px">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`relative -mb-px flex items-center gap-1.5 px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'font-medium text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {counts[f.id]}
              </span>
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-900" />
              ) : null}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500">
          No users in this filter.
        </p>
      ) : view === 'grid' ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((u) => (
            <div
              key={u.uid}
              className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200">
                  <Avatar user={u} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-900">
                    {u.displayName || u.username || '—'}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {u.email || '—'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${roleBadgeClass(u.role)}`}
                >
                  {roleLabel(u.role)}
                </span>
                {u.username ? (
                  <span className="truncate text-[11px] text-zinc-400">
                    @{u.username}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <ul className="divide-y divide-zinc-100">
            {filtered.map((u) => (
              <li
                key={u.uid}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/80"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200">
                  <Avatar user={u} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {u.displayName || u.username || '—'}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {u.email || '—'}
                    {u.username ? ` · @${u.username}` : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleBadgeClass(u.role)}`}
                >
                  {roleLabel(u.role)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
