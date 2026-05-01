'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PhotoAdminGatePage() {
  const [passkey, setPasskey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { openLoginModal } = useLoginModal();
  const { user, loading: authLoading } = useAuth();

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/photo-admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        if (data.error === 'not_configured') {
          setErr(
            'Server is not configured: set PHOTO_ADMIN_PASSKEY on the host (e.g. Vercel env) and redeploy.',
          );
        } else {
          setErr('Incorrect passkey.');
        }
        return;
      }
      setUnlocked(true);
      setPasskey('');
    } catch {
      setErr('Request failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-center text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          FOTOMATIC
        </p>
        <h1 className="mt-3 text-center font-serif text-2xl font-medium text-zinc-900">
          Photographer studio
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Enter the studio passkey, then sign in with the Google or email account
          you use for Fotomatic.
        </p>

        {!unlocked ? (
          <form
            onSubmit={verify}
            className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            {err ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {err}
              </p>
            ) : null}
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">Passkey</span>
              <input
                type="password"
                autoComplete="off"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-900/20"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : (
                'Unlock'
              )}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center">
            <p className="text-sm text-zinc-700">
              Passkey accepted. Sign in to open your photographer profile setup.
            </p>
            {authLoading ? (
              <p className="text-sm text-zinc-500">Loading session…</p>
            ) : user ? (
              <div className="grid gap-3">
                <Link
                  href="/photo-admin/setup"
                  className="inline-flex justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Continue to profile setup
                </Link>
                <Link
                  href="/photo-admin/bookings"
                  className="inline-flex justify-center rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  View bookings
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  openLoginModal({ redirectTo: '/photo-admin/setup' })
                }
                className="w-full cursor-pointer rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Sign in to Fotomatic
              </button>
            )}
            <p className="text-xs text-zinc-500">
              <Link href="/" className="underline">
                Back to site
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
