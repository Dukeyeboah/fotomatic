'use client';

import { useState } from 'react';
import Link from 'next/link';

function ClientAvatar({
  photoUrl,
  name,
}: {
  photoUrl?: string | null;
  name: string;
}) {
  const url = photoUrl?.trim();
  const hasPhoto = Boolean(url && /^https?:\/\//i.test(url));
  const [failed, setFailed] = useState(false);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length === 0
      ? '?'
      : parts.length === 1
        ? parts[0]!.slice(0, 2).toUpperCase()
        : `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-900/5">
      {hasPhoto && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
        <img
          src={url!}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#e8dfd2] text-sm font-semibold text-zinc-700">
          {initials}
        </div>
      )}
    </div>
  );
}

export function PhotographerRequestCard({
  clientName,
  clientAvatarUrl,
  shootType,
  location,
  date,
  duration,
  respondHref,
  onAccept,
  onSuggest,
  onDecline,
}: {
  clientName: string;
  /** HTTPS profile photo from booking; if missing, initials are shown. */
  clientAvatarUrl?: string | null;
  shootType: string;
  location: string;
  date: string;
  duration: string;
  respondHref?: string;
  onAccept?: () => void;
  onSuggest?: () => void;
  onDecline?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <ClientAvatar photoUrl={clientAvatarUrl} name={clientName} />
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900">{clientName}</p>
            <p className="mt-0.5 text-sm text-zinc-600">{shootType}</p>
            <p className="mt-1 text-xs text-zinc-500">{location}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {date} · {duration}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/80">
          New
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {respondHref ? (
          <Link
            href={respondHref}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Review &amp; respond
          </Link>
        ) : (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onSuggest}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Suggest Time
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Decline
            </button>
          </>
        )}
      </div>
    </div>
  );
}
