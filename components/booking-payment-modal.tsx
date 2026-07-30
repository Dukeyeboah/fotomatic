'use client';

import { useState } from 'react';
import type { User } from 'firebase/auth';
import type { BookingThread } from '@/lib/firebase/booking-threads';
import { Loader2, X } from 'lucide-react';

type Props = {
  thread: BookingThread;
  user: User;
  open: boolean;
  onClose: () => void;
};

export function BookingPaymentModal({ thread, user, open, onClose }: Props) {
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const total = thread.acceptedTotalPrice;
  const quoteLabel =
    typeof total === 'number' && Number.isFinite(total)
      ? `$${total.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '—';

  const startCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId: thread.id,
          discountCode: discountCode.trim() || undefined,
        }),
      });
      let data: { url?: string; error?: string; step?: string; hint?: string } =
        {};
      try {
        data = (await res.json()) as {
          url?: string;
          error?: string;
          step?: string;
          hint?: string;
        };
      } catch {
        setError(
          `Checkout failed (HTTP ${res.status}). Check Stripe and Firebase Admin env vars on the server.`,
        );
        setLoading(false);
        return;
      }
      if (!res.ok || !data.url) {
        const parts = [
          data.error ||
            `Could not start checkout (HTTP ${res.status}).`,
          data.step ? `Step: ${data.step}` : null,
          data.hint ?? null,
        ].filter(Boolean);
        setError(parts.join(' — '));
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      console.error('[BookingPaymentModal]', e);
      setError(
        e instanceof Error
          ? e.message
          : 'Network error. Please try again.',
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-pay-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="booking-pay-title"
              className="font-serif text-lg font-medium text-zinc-900"
            >
              Confirm & pay
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {thread.photographerName} · {thread.eventType}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-5 space-y-2 rounded-xl bg-zinc-50 px-4 py-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-600">Quoted total</dt>
            <dd className="font-semibold text-zinc-900">{quoteLabel}</dd>
          </div>
          <div className="flex justify-between gap-4 text-xs text-zinc-500">
            <dt>Date</dt>
            <dd>{thread.eventDate}</dd>
          </div>
        </dl>

        <label className="mt-5 block space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">
            Discount code (optional)
          </span>
          <input
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-900/20"
            placeholder="e.g. HOS2026"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            disabled={loading}
          />
          <p className="text-[11px] leading-snug text-zinc-500">
            Codes are created in Stripe (Products → Coupons → Promotion codes).
            You can also enter a code on the Stripe payment page when enabled.
          </p>
        </label>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          You&apos;ll be redirected to Stripe to enter your card details
          securely. Payment goes to Fotomatic&apos;s Stripe account for this
          booking.
        </p>

        <button
          type="button"
          disabled={loading || quoteLabel === '—'}
          onClick={() => void startCheckout()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to Stripe…
            </>
          ) : (
            'Continue to secure payment'
          )}
        </button>
      </div>
    </div>
  );
}
