'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { BookingPaymentModal } from '@/components/booking-payment-modal';
import { DirectoryListingPlaceholderImage } from '@/components/directory-listing-placeholder-image';
import type { BookingThread } from '@/lib/firebase/booking-threads';
import { bookingStatusBadgeForCard } from '@/lib/booking-status-display';
import {
  directoryPhotographerHeroImageUrl,
  photographerPlaceholderImagePath,
} from '@/lib/photographers-directory';
import { useMergedDirectoryPhotographers } from '@/lib/hooks/use-merged-directory-photographers';

export type DashboardBookingBadge = {
  label: string;
  className: string;
};

export function bookingToDashboardDisplay(
  thread: BookingThread,
): DashboardBookingBadge {
  return bookingStatusBadgeForCard(thread.status);
}

function BookingCardImage({
  directoryId,
}: {
  directoryId: string | undefined;
}) {
  const directory = useMergedDirectoryPhotographers();
  const listing = directoryId
    ? directory.find((p) => p.id === directoryId)
    : undefined;
  const hero = listing ? directoryPhotographerHeroImageUrl(listing) : undefined;
  const remote = hero && /^https?:\/\//i.test(hero) ? hero : null;
  const local =
    hero && hero.startsWith('/')
      ? hero
      : photographerPlaceholderImagePath(directoryId ?? 'fallback');
  const [failed, setFailed] = useState(false);

  if (failed || (!remote && !local)) {
    return (
      <DirectoryListingPlaceholderImage
        alt=""
        fill
        className="object-contain bg-white p-3"
        sizes="80px"
      />
    );
  }

  if (remote) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Firebase / remote profile URLs
      <img
        src={remote}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={local}
      alt=""
      fill
      className="object-cover"
      sizes="80px"
      onError={() => setFailed(true)}
    />
  );
}

export function DashboardBookingCard({
  thread,
  messagesHref,
}: {
  thread: BookingThread;
  messagesHref: string;
}) {
  const { user } = useAuth();
  const [payOpen, setPayOpen] = useState(false);
  const badge = bookingToDashboardDisplay(thread);
  const href = `${messagesHref}?thread=${encodeURIComponent(thread.id ?? '')}`;

  return (
    <>
      <Link
        href={href}
        className="group flex gap-4 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-900/5">
          <BookingCardImage directoryId={thread.photographerDirectoryId} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="font-semibold text-zinc-900">
              {thread.photographerName}
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{thread.eventType}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{thread.eventLocation}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {thread.eventDate}
            {thread.eventTimeframe ? ` · ${thread.eventTimeframe}` : ''}
            {thread.duration ? ` · ${thread.duration}` : ''}
          </p>
          {thread.status === 'accepted_pending_payment' ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPayOpen(true);
              }}
              className="mt-3 inline-flex rounded-xl bg-[#c4a574] px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-[#b89564]"
            >
              Complete Payment
            </button>
          ) : null}
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
      </Link>
      {payOpen && user ? (
        <BookingPaymentModal
          thread={thread}
          user={user}
          open={payOpen}
          onClose={() => setPayOpen(false)}
        />
      ) : null}
    </>
  );
}
