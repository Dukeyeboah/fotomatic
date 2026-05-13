'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Star } from 'lucide-react';
import {
  averageRatingFromReviews,
  fetchMyReviewForPhotographer,
  subscribeReviewsForPhotographerDirectory,
  submitPhotographerReview,
  type PhotographerReview,
} from '@/lib/firebase/photographer-reviews';

const FIELD =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 caret-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20';

export function StarRow({
  value,
  max = 5,
  size = 'md',
  interactive = false,
  onPick,
}: {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onPick?: (n: number) => void;
}) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div
      className={[
        'inline-flex items-center gap-0.5',
        interactive ? '' : 'pointer-events-none',
      ].join(' ')}
      role={interactive ? 'radiogroup' : undefined}
    >
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const on = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onPick?.(n)}
            className={[
              interactive ? 'cursor-pointer rounded p-0.5 hover:bg-amber-50' : '',
            ].join(' ')}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            <Star
              className={[
                dim,
                on ? 'fill-amber-400 text-amber-500' : 'fill-zinc-100 text-zinc-300',
              ].join(' ')}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

export function PhotographerReviewsPanel({
  photographerDirectoryId,
  photographerDisplayName,
  viewer,
  viewerDisplayName,
  isSelf,
  onNeedLogin,
  compact = false,
}: {
  photographerDirectoryId: string;
  photographerDisplayName: string;
  viewer: User | null;
  viewerDisplayName: string | null;
  isSelf: boolean;
  onNeedLogin: () => void;
  compact?: boolean;
}) {
  const [reviews, setReviews] = useState<PhotographerReview[]>([]);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [loadedMine, setLoadedMine] = useState(false);

  const dir = photographerDirectoryId.trim();

  useEffect(() => {
    if (!dir) {
      setReviews([]);
      return;
    }
    return subscribeReviewsForPhotographerDirectory(dir, setReviews);
  }, [dir]);

  useEffect(() => {
    if (!viewer || !dir || isSelf) {
      setLoadedMine(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const mine = await fetchMyReviewForPhotographer({
        photographerDirectoryId: dir,
        reviewerUserId: viewer.uid,
      });
      if (cancelled) return;
      if (mine) {
        setDraftRating(mine.rating);
        setDraftComment(mine.comment?.trim() ?? '');
      } else {
        setDraftRating(0);
        setDraftComment('');
      }
      setLoadedMine(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [viewer, dir, isSelf]);

  const { average, count } = useMemo(
    () => averageRatingFromReviews(reviews),
    [reviews],
  );

  const canReview = Boolean(viewer) && !isSelf && loadedMine;

  const submit = async () => {
    if (!viewer || !dir) return;
    if (draftRating < 1) {
      setBanner('Choose a star rating first.');
      return;
    }
    setSaving(true);
    setBanner(null);
    const res = await submitPhotographerReview({
      photographerDirectoryId: dir,
      reviewerUserId: viewer.uid,
      reviewerDisplayName: viewerDisplayName ?? viewer.displayName ?? null,
      rating: draftRating,
      comment: draftComment.trim() || null,
    });
    setSaving(false);
    if (!res.ok) setBanner(res.message);
    else setBanner('Thanks — your review was saved.');
  };

  return (
    <section
      className={[
        'rounded-2xl border border-zinc-200/90 bg-white',
        compact ? 'p-4' : 'p-5 sm:p-6',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Reviews
          </h3>
          <p className="mt-1 font-serif text-lg font-medium text-zinc-900">
            {count === 0 ? (
              'No reviews yet'
            ) : (
              <>
                {average.toFixed(1)}{' '}
                <span className="text-sm font-normal text-zinc-600">
                  ({count} rating{count === 1 ? '' : 's'})
                </span>
              </>
            )}
          </p>
        </div>
        {count > 0 ? (
          <StarRow value={average} interactive={false} size="md" />
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto border-t border-zinc-100 pt-4">
          {reviews.map((r) => (
            <li
              key={r.id ?? `${r.reviewerUserId}-${r.createdAt}`}
              className="rounded-xl bg-zinc-50/80 px-3 py-2.5 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-zinc-900">
                  {r.reviewerDisplayName?.trim() || 'Client'}
                </span>
                <StarRow value={r.rating} size="sm" />
              </div>
              {r.comment?.trim() ? (
                <p className="mt-1.5 text-zinc-700">{r.comment.trim()}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-zinc-600">
          {isSelf
            ? 'When clients leave ratings, they will show up here.'
            : `Be the first to leave feedback for ${photographerDisplayName}.`}
        </p>
      )}

      {isSelf ? (
        <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Client reviews for your listing appear here. Share your public profile
          so clients can rate you after a session.
        </p>
      ) : canReview ? (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <p className="text-sm font-semibold text-zinc-900">Your review</p>
          <p className="mt-1 text-xs text-zinc-500">
            Tap stars (required), optional comment, then save. You can update your
            review anytime.
          </p>
          {banner ? (
            <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {banner}
            </p>
          ) : null}
          <div className="mt-3">
            <p className="text-xs font-medium text-zinc-600">Rating</p>
            <div className="mt-1">
              <StarRow
                value={draftRating}
                interactive
                onPick={(n) => {
                  setDraftRating(n);
                  setBanner(null);
                }}
              />
            </div>
          </div>
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-medium text-zinc-600">
              Comment (optional)
            </span>
            <textarea
              rows={3}
              className={`${FIELD} min-h-[72px] resize-y`}
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              maxLength={2000}
            />
          </label>
          <button
            type="button"
            disabled={saving || draftRating < 1}
            onClick={() => void submit()}
            className="mt-3 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save review'}
          </button>
        </div>
      ) : !viewer ? (
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-zinc-300 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          onClick={onNeedLogin}
        >
          Log in to leave a review
        </button>
      ) : null}
    </section>
  );
}
