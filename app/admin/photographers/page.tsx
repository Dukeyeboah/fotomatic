'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Photographer } from '@/lib/firebase/firestore';
import {
  adminDeletePhotographer,
  adminSyncPhotographersFromJson,
  adminUpsertPhotographer,
  subscribePhotographersDirectory,
} from '@/lib/firebase/photographers-directory-admin';

export default function AdminPhotographersPage() {
  const [directoryPhotographers, setDirectoryPhotographers] = useState<
    Photographer[]
  >([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedDir, setSelectedDir] = useState<Photographer | null>(null);

  useEffect(() => {
    return subscribePhotographersDirectory(setDirectoryPhotographers);
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Photographers
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Firestore directory — sync from <code className="text-xs">data/photographers.json</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true);
              const res = await adminSyncPhotographersFromJson();
              setSyncing(false);
              if (!res.ok) alert(res.message);
              else alert(`Synced ${res.value.count} photographers.`);
            }}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync from JSON'}
          </button>
          <Link
            href="/admin"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {directoryPhotographers.length === 0 ? (
          <p className="text-sm text-zinc-600 md:col-span-2">
            No directory entries. Run sync from JSON.
          </p>
        ) : (
          directoryPhotographers.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm hover:bg-zinc-50"
              onClick={() => setSelectedDir(p)}
            >
              <p className="text-sm font-semibold text-zinc-900">
                {(p.firstName + ' ' + (p.lastName ?? '')).trim()}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{p.email || '—'}</p>
              <p className="mt-2 text-xs text-zinc-600">
                {p.city || p.address || '—'}
                {p.state ? `, ${p.state}` : ''}
              </p>
            </button>
          ))
        )}
      </div>

      {selectedDir ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/50"
            aria-label="Close"
            onClick={() => setSelectedDir(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Photographer
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {(selectedDir.firstName + ' ' + (selectedDir.lastName ?? '')).trim()}
                </p>
                <p className="mt-1 text-xs text-zinc-500">ID: {selectedDir.id}</p>
              </div>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                onClick={() => setSelectedDir(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Email</span>
                <input
                  type="email"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                  defaultValue={selectedDir.email ?? ''}
                  onBlur={async (e) => {
                    const v = e.target.value.trim();
                    const res = await adminUpsertPhotographer(selectedDir.id!, {
                      email: v || null,
                    });
                    if (!res.ok) alert(res.message);
                  }}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">City</span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                    defaultValue={selectedDir.city ?? ''}
                    onBlur={async (e) => {
                      const v = e.target.value.trim();
                      const res = await adminUpsertPhotographer(selectedDir.id!, {
                        city: v || null,
                      });
                      if (!res.ok) alert(res.message);
                    }}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Country</span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                    defaultValue={selectedDir.country ?? ''}
                    onBlur={async (e) => {
                      const v = e.target.value.trim();
                      const res = await adminUpsertPhotographer(selectedDir.id!, {
                        country: v || null,
                      });
                      if (!res.ok) alert(res.message);
                    }}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Website</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                  defaultValue={selectedDir.website ?? ''}
                  onBlur={async (e) => {
                    const v = e.target.value.trim();
                    const res = await adminUpsertPhotographer(selectedDir.id!, {
                      website: v || null,
                    });
                    if (!res.ok) alert(res.message);
                  }}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Instagram</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
                  defaultValue={selectedDir.instagram ?? ''}
                  onBlur={async (e) => {
                    const v = e.target.value.trim();
                    const res = await adminUpsertPhotographer(selectedDir.id!, {
                      instagram: v || null,
                    });
                    if (!res.ok) alert(res.message);
                  }}
                />
              </label>
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
                  onClick={async () => {
                    const ok = confirm('Delete this photographer from the directory?');
                    if (!ok) return;
                    const res = await adminDeletePhotographer(selectedDir.id!);
                    if (!res.ok) alert(res.message);
                    else setSelectedDir(null);
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                  onClick={() => setSelectedDir(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
