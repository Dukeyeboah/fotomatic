'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Photographer } from '@/lib/firebase/firestore';
import {
  adminSyncPhotographersFromJson,
  subscribePhotographersDirectory,
} from '@/lib/firebase/photographers-directory-admin';
import { photographerPlaceholderImagePath } from '@/lib/photographers-directory';
import { AdminPhotographerProfileModal } from '@/components/admin/admin-photographer-profile-modal';

/** Bulk JSON import is kept in code for rare use; hide from UI until you remove it entirely. */
const ADMIN_JSON_DIRECTORY_SYNC_ENABLED = false;

function cardImageUrl(p: Photographer & Record<string, unknown>): string {
  const photo =
    typeof p.photoUrl === 'string' && p.photoUrl.trim() ? p.photoUrl.trim() : '';
  if (photo) return photo;
  const gallery = p.galleryImageUrls;
  if (Array.isArray(gallery)) {
    const first = gallery.find(
      (u): u is string => typeof u === 'string' && u.trim().length > 0,
    );
    if (first) return first.trim();
  }
  return photographerPlaceholderImagePath(p.id ?? 'unknown');
}

function AdminPhotographersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');

  const [directoryPhotographers, setDirectoryPhotographers] = useState<
    Photographer[]
  >([]);
  const [syncing, setSyncing] = useState(false);
  const [selectedDir, setSelectedDir] = useState<Photographer | null>(null);

  useEffect(() => {
    return subscribePhotographersDirectory(setDirectoryPhotographers);
  }, []);

  useEffect(() => {
    if (!idFromUrl || directoryPhotographers.length === 0) return;
    const match = directoryPhotographers.find((p) => p.id === idFromUrl);
    if (match) setSelectedDir(match);
  }, [idFromUrl, directoryPhotographers]);

  const closeModal = () => {
    setSelectedDir(null);
    if (idFromUrl) {
      router.replace('/admin/photographers', { scroll: false });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Photographers
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Firestore directory. Click a card to view the full profile; edit from
            the modal.
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {directoryPhotographers.length === 0 ? (
          <p className="text-sm text-zinc-600 md:col-span-2">
            No directory entries yet. New photographers appear here when they
            complete onboarding and publish to the directory.
          </p>
        ) : (
          directoryPhotographers.map((p) => {
            const name = (
              p.firstName +
              ' ' +
              (p.lastName ?? '')
            ).trim();
            const img = cardImageUrl(p as Photographer & Record<string, unknown>);
            return (
              <button
                key={p.id}
                type="button"
                className="group cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                onClick={() => {
                  setSelectedDir(p);
                  if (p.id) {
                    router.replace(
                      `/admin/photographers?id=${encodeURIComponent(p.id)}`,
                      { scroll: false },
                    );
                  }
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                  />
                  {p.listed === false ? (
                    <span className="absolute left-2 top-2 rounded-md bg-amber-950/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-50">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-zinc-900">{name}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {p.email || '—'}
                  </p>
                  <p className="mt-2 text-xs text-zinc-600">
                    {p.city || p.address || '—'}
                    {p.state ? `, ${p.state}` : ''}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <AdminPhotographerProfileModal
        photographer={selectedDir}
        open={Boolean(selectedDir)}
        onClose={closeModal}
      />
    </div>
  );
}

export default function AdminPhotographersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <AdminPhotographersInner />
    </Suspense>
  );
}
