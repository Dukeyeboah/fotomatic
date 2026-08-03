'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import {
  earningsChartPointsFromThreads,
  earningsMonthOverMonthDeltaPct,
  earningsThisMonthFromThreads,
  lifetimeEarningsFromThreads,
} from '@/lib/photographer-booking-dashboard';
import { PhotographerEarningsChart } from '@/components/photographer/photographer-earnings-chart';
import { Loader2 } from 'lucide-react';

type ConnectStatus = {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

export default function PhotographerEarningsClient() {
  const { user, refreshUserData } = useAuth();
  const searchParams = useSearchParams();
  const { threads, loading } = usePhotographerBookingThreads();
  const month = earningsThisMonthFromThreads(threads);
  const delta = earningsMonthOverMonthDeltaPct(threads);
  const lifetime = lifetimeEarningsFromThreads(threads);
  const points = earningsChartPointsFromThreads(threads);

  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const syncConnect = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as ConnectStatus & { error?: string };
      if (!res.ok) {
        setConnectError(data.error ?? 'Could not load payout status.');
        return;
      }
      setConnect({
        accountId: data.accountId,
        chargesEnabled: data.chargesEnabled,
        payoutsEnabled: data.payoutsEnabled,
        detailsSubmitted: data.detailsSubmitted,
      });
      setConnectError(null);
      await refreshUserData();
    } catch {
      setConnectError('Could not load payout status.');
    }
  }, [user, refreshUserData]);

  useEffect(() => {
    void syncConnect();
  }, [syncConnect]);

  useEffect(() => {
    const flag = searchParams.get('connect');
    if (flag === 'return' || flag === 'refresh') {
      void syncConnect();
    }
  }, [searchParams, syncConnect]);

  const startOnboarding = async () => {
    if (!user) return;
    setConnectBusy(true);
    setConnectError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setConnectError(data.error ?? 'Could not open Stripe onboarding.');
        setConnectBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setConnectError('Could not open Stripe onboarding.');
      setConnectBusy(false);
    }
  };

  const payoutReady = Boolean(connect?.payoutsEnabled);

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Earnings & payouts
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Confirmed bookings are tracked here. Connect a Stripe payout account so
        Fotomatic can send your share on scheduled payouts.
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Payout account</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Bank details are collected securely by Stripe Connect (Express).
          Fotomatic never stores your full banking numbers.
        </p>
        {connectError ? (
          <p className="mt-3 text-sm text-red-700">{connectError}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {connect == null ? (
            <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
            </span>
          ) : payoutReady ? (
            <p className="text-sm font-medium text-emerald-800">
              Payouts enabled
              {connect.accountId
                ? ` · ${connect.accountId.slice(0, 12)}…`
                : ''}
            </p>
          ) : (
            <p className="text-sm text-amber-900">
              {connect.accountId
                ? 'Finish Stripe onboarding to enable payouts.'
                : 'Connect Stripe to receive payouts.'}
            </p>
          )}
          <button
            type="button"
            disabled={connectBusy}
            onClick={() => void startOnboarding()}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {connectBusy
              ? 'Opening Stripe…'
              : payoutReady
                ? 'Update payout details'
                : 'Connect with Stripe'}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-600">This month</p>
          <p className="mt-1 font-serif text-3xl text-zinc-900">
            {loading ? '…' : `$${month.toLocaleString()}`}
          </p>
          {!loading ? (
            <p
              className={`mt-1 text-sm font-semibold ${
                delta >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {delta >= 0 ? '+' : ''}
              {delta}% vs last month
            </p>
          ) : null}
          <div className="mt-4 rounded-xl bg-zinc-50 p-3">
            <PhotographerEarningsChart points={points} />
          </div>
        </div>
        <dl className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between border-b border-zinc-100 pb-3">
            <dt className="text-zinc-600">Lifetime (confirmed)</dt>
            <dd className="font-semibold text-zinc-900">
              {loading ? '…' : `$${lifetime.toLocaleString()}`}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Open booking requests</dt>
            <dd className="font-semibold text-zinc-900">
              {loading
                ? '…'
                : threads.filter((t) => t.status === 'requested').length}
            </dd>
          </div>
        </dl>
      </div>
      <Link
        href="/photographer"
        className="mt-8 inline-block text-sm font-semibold text-amber-900 hover:underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
