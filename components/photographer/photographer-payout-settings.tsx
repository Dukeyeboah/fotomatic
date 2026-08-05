'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type ConnectStatus = {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

/**
 * Stripe Connect Express onboarding for photographer payouts.
 * Bank / debit details are collected on Stripe’s hosted pages — not in Firebase.
 */
export function PhotographerPayoutSettings() {
  const { user, refreshUserData } = useAuth();
  const searchParams = useSearchParams();
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
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        Connect with Stripe to receive payouts. You&apos;ll enter bank or debit
        details on Stripe&apos;s secure page — Fotomatic never stores your full
        banking numbers in Firebase.
      </p>
      {connectError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {connectError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
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
  );
}
