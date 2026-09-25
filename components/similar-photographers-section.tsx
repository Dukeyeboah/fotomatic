'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { BookingRequestModal } from '@/components/booking-request-modal';
import { DashboardPhotographerCard } from '@/components/dashboard/dashboard-photographer-card';
import { PhotographerPublicDetailModal } from '@/components/photographer-public-detail-modal';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';
import { useSavedPhotographerIds } from '@/lib/hooks/use-saved-photographer-ids';
import { usePhotographerDirectoryReviewStats } from '@/lib/hooks/use-directory-review-stats';
import { findSimilarPhotographers } from '@/lib/similar-photographers';
import { isOwnDirectoryPhotographerListing } from '@/lib/directory-photographer-self';
import type { DirectoryPhotographer } from '@/lib/photographers-directory';
import { CannotFavoriteSelfDialog } from '@/components/cannot-favorite-self-dialog';

export function SimilarPhotographersSection({
  photographer,
  browseHref = '/photographers',
}: {
  photographer: DirectoryPhotographer;
  browseHref?: string;
}) {
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const directory = useMergedDirectoryPhotographers();
  const { toggle, isSaved } = useSavedPhotographerIds();
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

  const similar = useMemo(
    () => findSimilarPhotographers(photographer, directory, 6),
    [photographer, directory],
  );

  if (similar.length === 0) return null;

  const tryToggleFavorite = (p: DirectoryPhotographer) => {
    if (!user) {
      openLoginModal({ redirectTo: browseHref });
      return;
    }
    if (isOwnDirectoryPhotographerListing(p, viewerForSelf)) {
      setSelfFavoriteOpen(true);
      return;
    }
    toggle(p.id);
  };

  return (
    <section className="mt-16 border-t border-zinc-200/80 pt-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-medium tracking-tight text-zinc-900">
              Similar photographers
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-zinc-600">
              More creatives with overlapping specialties and nearby coverage —
              explore other fits for your shoot.
            </p>
          </div>
          <Link
            href={browseHref}
            className="text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
          >
            Browse all →
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-center">
          <div className="flex max-w-[min(100vw,72rem)] gap-4 overflow-x-auto px-4 pb-3 pt-1 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similar.map((p) => (
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
                    openLoginModal({ redirectTo: browseHref });
                    return;
                  }
                  setBookingPhotographer(p);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <PhotographerPublicDetailModal
        photographer={detailPhotographer}
        open={detailPhotographer != null}
        onClose={() => setDetailPhotographer(null)}
        onRequestBooking={(p) => {
          setDetailPhotographer(null);
          if (!user) {
            openLoginModal({ redirectTo: browseHref });
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
    </section>
  );
}
