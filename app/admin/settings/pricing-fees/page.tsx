'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  photographerSharePercent,
  platformFeePercent,
} from '@/lib/stripe/connect-config';

/**
 * Client-safe display of defaults (baked at build from env).
 * Live transfers use server env via /api/stripe/connect/transfer.
 */
const DEFAULT_SHARE = photographerSharePercent();
const DEFAULT_FEE = platformFeePercent();

export default function AdminPricingFeesPage() {
  const { user } = useAuth();
  const [threadId, setThreadId] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
  }, [threadId]);

  const runTransfer = async () => {
    if (!user || !threadId.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/connect/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ threadId: threadId.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        skipped?: boolean;
        reason?: string;
        transferId?: string | null;
        amountCents?: number;
        photographerSharePercent?: number;
      };
      if (!res.ok) {
        setResult(data.error ?? 'Transfer failed.');
      } else if (data.skipped) {
        setResult(data.reason ?? 'Skipped.');
      } else {
        setResult(
          `Transferred $${((data.amountCents ?? 0) / 100).toFixed(2)} (${data.photographerSharePercent ?? DEFAULT_SHARE}% photographer share). Transfer ${data.transferId}.`,
        );
      }
    } catch {
      setResult('Transfer failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Pricing &amp; fees
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Clients pay Fotomatic’s Stripe account. Photographers onboard Connect
        Express accounts, then you transfer their share from platform balance
        (scheduled or manual).
      </p>

      <dl className="mt-8 max-w-md space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600">Photographer share</dt>
          <dd className="font-semibold text-zinc-900">{DEFAULT_SHARE}%</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600">Platform fee</dt>
          <dd className="font-semibold text-zinc-900">{DEFAULT_FEE}%</dd>
        </div>
        <p className="pt-2 text-xs text-zinc-500">
          Set via <code className="text-zinc-700">STRIPE_PHOTOGRAPHER_SHARE_PERCENT</code>{' '}
          (or <code className="text-zinc-700">STRIPE_PLATFORM_FEE_PERCENT</code>) on
          the server, then redeploy.
        </p>
      </dl>

      <div className="mt-10 max-w-lg space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">
          Manual photographer transfer
        </h2>
        <p className="text-sm text-zinc-600">
          Pays out the photographer share for one confirmed booking thread (idempotent).
        </p>
        <input
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
          placeholder="bookingThreads document id"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
        <button
          type="button"
          disabled={busy || !threadId.trim()}
          onClick={() => void runTransfer()}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? 'Transferring…' : 'Transfer photographer share'}
        </button>
        {result ? (
          <p className="text-sm text-zinc-700">{result}</p>
        ) : null}
      </div>

      <Link
        href="/admin"
        className="mt-8 inline-block text-sm font-semibold text-amber-900 hover:underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
