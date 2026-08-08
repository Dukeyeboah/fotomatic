'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { BookingRequestModal } from '@/components/booking-request-modal';
import { DashboardPhotographerCard } from '@/components/dashboard/dashboard-photographer-card';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { CannotFavoriteSelfDialog } from '@/components/cannot-favorite-self-dialog';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { usePhotographerDirectoryReviewStats } from '@/lib/hooks/use-directory-review-stats';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import type { DirectoryPhotographer } from '@/lib/photographers-directory';

export function FavoritesPhotographersView({
  browseHref,
  loginRedirectTo,
}: {
  browseHref: string;
  loginRedirectTo: string;
}) {
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const directory = useMergedDirectoryPhotographers();
  const { savedIds, toggle, isSaved } = useSavedPhotographerIds();
  const reviewStats = usePhotographerDirectoryReviewStats();
  const [detailPhotographer, setDetailPhotographer] =
    useState<DirectoryPhotographer | null>(null);
  const [bookingPhotographer, setBookingPhotographer] =
    useState<DirectoryPhotographer | null>(null);
  const [selfFavoriteOpen, setSelfFavoriteOpen] = useState(false);

  const viewerForSelf = useMemo(
    () => ({
      uid: user?.uid,
      role: userData?.role,
      directoryId: userData?.photographer?.directoryId,
    }),
    [user?.uid, userData?.role, userData?.photographer?.directoryId],
  );

  const favorites = useMemo(
    () => directory.filter((p) => savedIds.includes(p.id)),
    [directory, savedIds],
  );

  const tryToggleFavorite = (p: DirectoryPhotographer) => {
    if (!user) {
      openLoginModal({ redirectTo: loginRedirectTo });
      return;
    }
    if (isOwnDirectoryPhotographerListing(p, viewerForSelf)) {
      setSelfFavoriteOpen(true);
      return;
    }
    toggle(p.id);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900 sm:text-3xl">
            Favorites
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Photographers you’ve hearted — ready when you want to book or
            revisit their work.
          </p>
        </div>
        <Link
          href={browseHref}
          className="text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
        >
          Browse photographers →
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <Heart className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-sm text-zinc-600">
            No favorites yet. Heart photographers you love from the directory or
            their profile.
          </p>
          <Link
            href={browseHref}
            className="mt-5 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Explore photographers
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((p) => (
            <DashboardPhotographerCard
              key={p.id}
              photographer={p}
              saved={isSaved(p.id)}
              onToggleSave={() => tryToggleFavorite(p)}
              onOpenDetail={() => setDetailPhotographer(p)}
              reviewSummary={reviewStats.get(p.id)}
              showRequestBooking={
                !isOwnDirectoryPhotographerListing(p, viewerForSelf)
              }
              onRequestBooking={() => {
                if (!user) {
                  openLoginModal({ redirectTo: loginRedirectTo });
                  return;
                }
                setBookingPhotographer(p);
              }}
            />
          ))}
        </div>
      )}

      <PhotographerPublicDetailModal
        photographer={detailPhotographer}
        open={detailPhotographer != null}
        onClose={() => setDetailPhotographer(null)}
        onRequestBooking={(p) => {
          setDetailPhotographer(null);
          if (!user) {
            openLoginModal({ redirectTo: loginRedirectTo });
            return;
          }
          setBookingPhotographer(p);
        }}
        saved={detailPhotographer ? isSaved(detailPhotographer.id) : false}
        onToggleSave={() => {
          if (detailPhotographer) tryToggleFavorite(detailPhotographer);
        }}
        user={user}
        openLoginModal={(o) => openLoginModal(o)}
        canRequestBooking={
          detailPhotographer
            ? !isOwnDirectoryPhotographerListing(
                detailPhotographer,
                viewerForSelf,
              )
            : true
        }
      />

      {user && bookingPhotographer ? (
        <BookingRequestModal
          photographer={bookingPhotographer}
          user={user}
          userData={userData}
          onClose={() => setBookingPhotographer(null)}
        />
      ) : null}

      <CannotFavoriteSelfDialog
        open={selfFavoriteOpen}
        onClose={() => setSelfFavoriteOpen(false)}
      />
    </div>
  );
}
