'use client';

import { useState, type ReactNode, Suspense } from 'react';
import Link from 'next/link';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { parsePhotographyFocusesFromFirestore } from '@/lib/photography-focus';
import { PhotographerPayoutSettings } from '@/components/photographer/photographer-payout-settings';

function CollapsibleSettingsCard({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.75}
        />
      </button>
      {open ? (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4">{children}</div>
      ) : null}
    </div>
  );
}

function usernameFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '—';
  return email.split('@')[0]!;
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900">{value}</dd>
    </div>
  );
}

export default function PhotographerSettingsPage() {
  const { user, userData, loading } = useAuth();
  const ph = userData?.photographer;
  const focuses = parsePhotographyFocusesFromFirestore({
    photographyFocuses: ph?.photographyFocuses,
    photographyFocus: ph?.photographyFocus,
    style: ph?.style,
  });
  const focusLabel =
    focuses.length > 0
      ? focuses.join(', ')
      : ph?.photographyFocus?.trim() || '—';
  const price =
    typeof ph?.startingPrice === 'number'
      ? ph.startingPrice
      : typeof ph?.hourlyRate === 'number'
        ? ph.hourlyRate
        : null;
  const priceLabel =
    price != null && Number.isFinite(price) ? `$${price}` : '—';
  const contactEmail =
    userData?.email?.trim() || user?.email?.trim() || '—';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Account settings
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Review your account, set up payouts, and find help.
      </p>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      ) : !user ? (
        <p className="mt-8 text-sm text-zinc-600">Log in to manage settings.</p>
      ) : (
        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:items-start">
          <CollapsibleSettingsCard title="Account summary" defaultOpen>
            <div className="grid gap-6 sm:grid-cols-2">
              <dl className="space-y-3">
                <SummaryField
                  label="Username"
                  value={
                    userData?.username ?? usernameFromEmail(user.email)
                  }
                />
                <SummaryField
                  label="Email"
                  value={user.email ?? '—'}
                />
                <SummaryField label="Account type" value="Photographer" />
                <SummaryField
                  label="Location"
                  value={
                    [userData?.city, userData?.state, userData?.country]
                      .filter(Boolean)
                      .join(', ') || '—'
                  }
                />
              </dl>
              <dl className="space-y-3">
                <SummaryField label="Photography focus" value={focusLabel} />
                <SummaryField
                  label="Default starting price"
                  value={priceLabel}
                />
                <SummaryField
                  label="Primary service area"
                  value={ph?.serviceArea?.trim() || '—'}
                />
                <SummaryField
                  label="Phone"
                  value={ph?.phone?.trim() || '—'}
                />
                <SummaryField label="Email" value={contactEmail} />
              </dl>
            </div>
            <Link
              href="/photographer/profile"
              className="mt-4 inline-block text-sm font-semibold text-amber-900 hover:underline"
            >
              Edit profile →
            </Link>
          </CollapsibleSettingsCard>

          <div className="space-y-4">
            <CollapsibleSettingsCard title="Payment & payouts" defaultOpen>
              <Suspense
                fallback={
                  <p className="text-sm text-zinc-500">
                    Loading payout settings…
                  </p>
                }
              >
                <PhotographerPayoutSettings />
              </Suspense>
            </CollapsibleSettingsCard>

            <CollapsibleSettingsCard title="Help">
              <p className="text-sm text-zinc-600">
                Questions about bookings, payouts, or your public profile? Reach
                the Fotomatic team from the help center.
              </p>
              <Link
                href="/photographer/contact"
                className="mt-3 inline-block text-sm font-semibold text-amber-900 hover:underline"
              >
                Open help center →
              </Link>
            </CollapsibleSettingsCard>
          </div>
        </div>
      )}
    </div>
  );
}
