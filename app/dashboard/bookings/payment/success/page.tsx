'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function BookingPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'ok' | 'err'>(
    'idle',
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !sessionId) return;

    let cancelled = false;
    setStatus('verifying');

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        let data: {
          ok?: boolean;
          error?: string;
          paymentStatus?: string;
        } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          if (!cancelled) {
            setStatus('err');
            setMessage(
              `Could not confirm payment (HTTP ${res.status}). Your card may still have been charged — check bookings or Stripe email.`,
            );
          }
          return;
        }

        if (cancelled) return;

        if (!res.ok) {
          setStatus('err');
          setMessage(data.error ?? 'Could not confirm payment.');
          return;
        }

        if (data.paymentStatus === 'paid' || data.ok) {
          setStatus('ok');
        } else {
          setStatus('err');
          setMessage('Payment is still processing. Refresh in a moment.');
        }
      } catch {
        if (!cancelled) {
          setStatus('err');
          setMessage(
            'Could not verify payment. Your card may still have been charged — check email from Stripe.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, sessionId]);

  const showSpinner =
    Boolean(sessionId) &&
    (status === 'idle' || status === 'verifying' || loading);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {showSpinner ? (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-zinc-400" />
          <p className="mt-4 text-sm text-zinc-600">Confirming your payment…</p>
        </>
      ) : status === 'ok' ? (
        <>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-medium text-zinc-900">
            Payment successful
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Your booking is confirmed. The photographer has been notified.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard/bookings"
              className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              View bookings
            </Link>
            <Link
              href="/dashboard/messages"
              className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Messages
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Payment status
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {message ||
              (!sessionId
                ? 'Missing payment session. Return from Stripe checkout or open bookings.'
                : 'Something went wrong verifying payment.')}
          </p>
          <Link
            href="/dashboard/bookings"
            className="mt-8 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Back to bookings
          </Link>
        </>
      )}
    </div>
  );
}
