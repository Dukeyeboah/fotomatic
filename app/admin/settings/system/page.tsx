'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  photographerSharePercent,
  platformFeePercent,
} from '@/lib/stripe/connect-config';
import {
  DEFAULT_PLATFORM_PAYMENT_SETTINGS,
  savePlatformPaymentSettings,
  subscribePlatformPaymentSettings,
  type PlatformPaymentSettings,
} from '@/lib/firebase/platform-settings';

const DEFAULT_SHARE = photographerSharePercent();
const DEFAULT_FEE = platformFeePercent();

export default function AdminSystemSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PlatformPaymentSettings>(
    DEFAULT_PLATFORM_PAYMENT_SETTINGS,
  );
  const [minPrice, setMinPrice] = useState(
    String(DEFAULT_PLATFORM_PAYMENT_SETTINGS.minPhotographerStartingPrice),
  );
  const [maxPrice, setMaxPrice] = useState(
    String(DEFAULT_PLATFORM_PAYMENT_SETTINGS.maxPhotographerStartingPrice),
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [threadId, setThreadId] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    return subscribePlatformPaymentSettings((s) => {
      setSettings(s);
      setMinPrice(String(s.minPhotographerStartingPrice));
      setMaxPrice(String(s.maxPhotographerStartingPrice));
      setNotes(s.notes ?? '');
    });
  }, []);

  useEffect(() => {
    setResult(null);
  }, [threadId]);

  const savePaymentLimits = async () => {
    setSaving(true);
    setSaveMsg(null);
    const min = Math.round(Number(minPrice));
    const max = Math.round(Number(maxPrice));
    if (!Number.isFinite(min) || min < 0) {
      setSaving(false);
      setSaveMsg('Enter a valid minimum price.');
      return;
    }
    if (!Number.isFinite(max) || max < min) {
      setSaving(false);
      setSaveMsg('Maximum must be greater than or equal to minimum.');
      return;
    }
    const res = await savePlatformPaymentSettings({
      minPhotographerStartingPrice: min,
      maxPhotographerStartingPrice: max,
      notes,
    });
    setSaving(false);
    setSaveMsg(res.ok ? 'Saved payment limits.' : res.message);
  };

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
        System settings
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Platform configuration for payments, Connect payouts, and admin
        operations.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Payment systems
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Clients pay Fotomatic’s Stripe account. Photographers use Connect
              Express; you transfer their share from platform balance.
            </p>
          </div>

          <dl className="grid gap-3 rounded-xl bg-zinc-50 p-4 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-zinc-600">Photographer share</dt>
              <dd className="font-semibold text-zinc-900">{DEFAULT_SHARE}%</dd>
            </div>
            <div className="flex justify-between gap-4 sm:block">
              <dt className="text-zinc-600">Platform fee</dt>
              <dd className="font-semibold text-zinc-900">{DEFAULT_FEE}%</dd>
            </div>
            <p className="text-xs text-zinc-500 sm:col-span-2">
              Live transfer split is set via{' '}
              <code className="text-zinc-700">
                STRIPE_PHOTOGRAPHER_SHARE_PERCENT
              </code>{' '}
              (or{' '}
              <code className="text-zinc-700">STRIPE_PLATFORM_FEE_PERCENT</code>)
              on the server.
            </p>
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">
                Minimum photographer starting price (USD)
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-zinc-600">
                Maximum photographer starting price (USD)
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">
              Admin notes (optional)
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about fee policy, promo periods, etc."
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePaymentLimits()}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save payment limits'}
            </button>
            {saveMsg ? (
              <p className="text-sm text-zinc-700">{saveMsg}</p>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">
            Current stored floor: ${settings.minPhotographerStartingPrice} ·
            ceiling: ${settings.maxPhotographerStartingPrice}. Enforce these in
            photographer profile validation when you wire them into the form.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-zinc-900">
              Manual photographer transfer
            </h2>
            <p className="text-sm text-zinc-600">
              Pays out the photographer share for one confirmed booking thread
              (idempotent).
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
            {result ? <p className="text-sm text-zinc-700">{result}</p> : null}
          </section>

          <section className="flex-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-sm font-semibold text-zinc-900">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/admin/photographers"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Photographers directory
                </Link>
                <span className="text-zinc-500">
                  {' '}
                  — listings, deactivate, edit
                </span>
              </li>
              <li>
                <Link
                  href="/admin/bookings"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Booking threads
                </Link>
                <span className="text-zinc-500"> — payments & lifecycle</span>
              </li>
              <li>
                <Link
                  href="/admin/inbox"
                  className="font-semibold text-amber-900 hover:underline"
                >
                  Applications
                </Link>
                <span className="text-zinc-500">
                  {' '}
                  — approve new photographers
                </span>
              </li>
            </ul>
          </section>
        </div>
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
