'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Photographer } from '@/lib/firebase/firestore';
import {
  adminDeletePhotographer,
  adminPermanentlyDeletePhotographerDoc,
  adminSyncPhotographersFromJson,
  adminUpsertPhotographer,
  subscribePhotographersDirectory,
} from '@/lib/firebase/photographers-directory-admin';

/** Bulk JSON import is kept in code for rare use; hide from UI until you remove it entirely. */
const ADMIN_JSON_DIRECTORY_SYNC_ENABLED = false;

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
            Firestore directory. Photographers are expected to sign up through the app;
            JSON bulk import is disabled here to avoid accidental merges.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!ADMIN_JSON_DIRECTORY_SYNC_ENABLED || syncing}
            title={
              ADMIN_JSON_DIRECTORY_SYNC_ENABLED
                ? undefined
                : 'JSON directory sync is turned off. Enable ADMIN_JSON_DIRECTORY_SYNC_ENABLED in code if you need a one-off import.'
            }
            onClick={async () => {
              if (!ADMIN_JSON_DIRECTORY_SYNC_ENABLED) return;
              setSyncing(true);
              const res = await adminSyncPhotographersFromJson();
              setSyncing(false);
              if (!res.ok) alert(res.message);
              else alert(`Synced ${res.value.count} photographers.`);
            }}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
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
            No directory entries yet. New photographers appear here when they complete
            onboarding and publish to the directory.
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
              {p.listed === false ? (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                  Hidden from public directory
                </p>
              ) : null}
            </button>
          ))
        )}
      </div>

      {selectedDir ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/50"
            aria-label="Close"
            onClick={() => setSelectedDir(null)}
          />
          <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-zinc-200 border-b-0 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:border-b sm:p-6 sm:pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Photographer
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {(selectedDir.firstName + ' ' + (selectedDir.lastName ?? '')).trim()}
                </p>
                <p className="mt-1 text-xs text-zinc-500">ID: {selectedDir.id}</p>
                {selectedDir.listed === false ? (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    Hidden from the public directory. You can publish again, or
                    permanently remove this Firestore document (see actions below).
                  </p>
                ) : null}
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
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {selectedDir.listed === false ? (
                    <>
                      <button
                        type="button"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                        onClick={async () => {
                          const res = await adminUpsertPhotographer(
                            selectedDir.id!,
                            {
                              listed: true,
                            },
                          );
                          if (!res.ok) {
                            alert(res.message);
                            return;
                          }
                          setSelectedDir(null);
                        }}
                      >
                        Show in directory again
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-red-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={async () => {
                          const ok = confirm(
                            [
                              'Permanently delete this Firestore document?',
                              '',
                              'This cannot be undone. The directory row will be removed completely.',
                              'If this person is still an active photographer on Fotomatic, their app may create a new listing the next time they use it.',
                            ].join('\n'),
                          );
                          if (!ok) return;
                          const res = await adminPermanentlyDeletePhotographerDoc(
                            selectedDir.id!,
                          );
                          if (!res.ok) {
                            alert(res.message);
                            return;
                          }
                          setSelectedDir(null);
                        }}
                      >
                        Permanently delete from database
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
                      onClick={async () => {
                        const ok = confirm(
                          'Remove this photographer from the public directory? Their Firestore row will stay (delisted) so it does not reappear when they next use the app.',
                        );
                        if (!ok) return;
                        const res = await adminDeletePhotographer(selectedDir.id!);
                        if (!res.ok) alert(res.message);
                        else setSelectedDir(null);
                      }}
                    >
                      Remove from directory
                    </button>
                  )}
                </div>
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
