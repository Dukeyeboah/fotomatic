'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  getApplicationById,
  markPhotographerAdminEventsReadForApplication,
  type PhotographerApplication,
} from '@/lib/firebase/admin';
import {
  adminApprovePhotographerApplication,
  adminDeclinePhotographerApplication,
} from '@/lib/firebase/admin-actions';
import { ExternalLink, Handshake, Loader2, X } from 'lucide-react';

function normalizeUrl(s: string): string {
  const t = (s ?? '').trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  return `https://${t}`;
}

function splitLinks(s: string | undefined): string[] {
  const t = (s ?? '').trim();
  if (!t) return [];
  return t
    .split(/\s+|,|\n/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function dash(s: string | undefined | null): string {
  const t = (s ?? '').trim();
  return t || '—';
}

function formatHourlyRate(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

type DecisionDialog =
  | null
  | { kind: 'confirm'; action: 'approve' | 'decline' }
  | { kind: 'success'; action: 'approve' | 'decline' }
  | { kind: 'error'; message: string };

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [app, setApp] = useState<PhotographerApplication | null>(null);
  const [decisionDialog, setDecisionDialog] = useState<DecisionDialog>(null);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      const a = await getApplicationById(id);
      setApp(a);
    })();
  }, [user, isAdmin, id]);

  useEffect(() => {
    if (!isAdmin || !id) return;
    void markPhotographerAdminEventsReadForApplication(id);
  }, [isAdmin, id]);

  async function runDecision(action: 'approve' | 'decline') {
    if (!app?.id) return;
    setDecisionSubmitting(true);
    const res =
      action === 'approve'
        ? await adminApprovePhotographerApplication({
            applicationId: app.id,
            applicantUserId: app.applicantUserId,
            applicantName: app.name,
          })
        : await adminDeclinePhotographerApplication({
            applicationId: app.id,
            applicantUserId: app.applicantUserId,
            applicantName: app.name,
          });
    setDecisionSubmitting(false);
    if (res.ok) {
      const refreshed = await getApplicationById(id);
      setApp(refreshed);
      setDecisionDialog({ kind: 'success', action });
    } else {
      setDecisionDialog({ kind: 'error', message: res.message });
    }
  }

  return (
    <>
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          ADMIN
        </p>
        <h1 className="mt-2 font-serif text-2xl font-medium text-zinc-900">
          Application review
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          <Link href="/admin/inbox" className="underline">
            Applications & bookings
          </Link>{' '}
          ·{' '}
          <Link href="/admin" className="underline">
            Dashboard
          </Link>
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : !user ? (
          <p className="mt-8 text-sm text-zinc-600">
            <button
              type="button"
              onClick={() =>
                openLoginModal({
                  redirectTo: `/admin/applications/${encodeURIComponent(id)}`,
                })
              }
              className="cursor-pointer font-medium text-amber-900 underline"
            >
              Log in
            </button>{' '}
            to review applications.
          </p>
        ) : !isAdmin ? (
          <div className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 text-sm text-amber-950">
            Not authorized.
          </div>
        ) : !app ? (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Application not found (or it may be older than the recent list).
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-zinc-900">
                    {app.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{app.email}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {app.city}
                    {app.state ? `, ${app.state}` : ''} · {app.country}
                  </p>
                  <p className="mt-2 text-xs">
                    <span className="rounded-full border border-zinc-200 px-2 py-0.5 font-semibold text-zinc-700">
                      {app.status}
                    </span>
                  </p>
                </div>

                {app.status === 'submitted' && app.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                      onClick={() =>
                        setDecisionDialog({ kind: 'confirm', action: 'approve' })
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                      onClick={() =>
                        setDecisionDialog({ kind: 'confirm', action: 'decline' })
                      }
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Contact & location
              </p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Legal / display name
                  </dt>
                  <dd className="mt-1 text-zinc-900">{dash(app.name)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    First & last name
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {dash(
                      [app.firstName, app.lastName].filter(Boolean).join(' ') ||
                        undefined,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Phone
                  </dt>
                  <dd className="mt-1 text-zinc-900">{dash(app.phone)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Street address
                  </dt>
                  <dd className="mt-1 text-zinc-900">{dash(app.address)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    City, state, country
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {dash(
                      [
                        app.city,
                        app.state,
                        app.country,
                      ]
                        .filter((x) => (x ?? '').trim())
                        .join(', ') || undefined,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    OK to contact by phone
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {app.phoneContact ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    OK to contact by email
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {app.emailContact ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Bio</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                {dash(app.bio)}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Focus & business
              </p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Photography focus / specialty
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {Array.isArray(app.photographyFocuses) &&
                    app.photographyFocuses.length > 0
                      ? app.photographyFocuses.join(' · ')
                      : dash(app.photographyFocus)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Default starting price
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {formatHourlyRate(
                      app.startingPrice ?? app.startingHourlyRate,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Interested in client work
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {app.interestedInClientWork ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Region & service area
              </p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Primary service region / area
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-zinc-900">
                    {dash(app.serviceArea)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Open to other areas
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {app.openToOtherAreas ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Links & portfolio
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <LinkRow label="Instagram" value={app.instagram} />
                <LinkRow label="X (Twitter)" value={app.twitter} />
                <LinkRow label="Facebook" value={app.facebook} />
                <LinkRow label="Website" value={app.website} />
                <PortfolioLinks value={app.portfolioLinks} />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Other</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    How they heard about Fotomatic
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {dash(app.howDidYouHear)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Applicant UID
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-zinc-600">
                    {app.applicantUserId}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
    </div>

    {decisionDialog && app ? (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
        role="presentation"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          if (decisionSubmitting) return;
          if (decisionDialog.kind === 'confirm') setDecisionDialog(null);
        }}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="decision-dialog-title"
        >
          {!decisionSubmitting &&
          (decisionDialog.kind === 'confirm' ||
            decisionDialog.kind === 'success' ||
            decisionDialog.kind === 'error') ? (
            <button
              type="button"
              className="absolute right-3 top-3 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Close"
              onClick={() => setDecisionDialog(null)}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {decisionDialog.kind === 'confirm' ? (
            <>
              <h2
                id="decision-dialog-title"
                className="pr-10 font-serif text-xl font-medium text-zinc-900"
              >
                {decisionDialog.action === 'approve'
                  ? 'Approve photographer?'
                  : 'Decline application?'}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                {decisionDialog.action === 'approve'
                  ? `${app.name} will get photographer access, appear in the directory, and receive a notification to finish their profile.`
                  : `${app.name} will receive a message that their application was not approved at this time.`}
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={decisionSubmitting}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                  onClick={() => setDecisionDialog(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={decisionSubmitting}
                  className={[
                    'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
                    decisionDialog.action === 'approve'
                      ? 'bg-zinc-900 hover:bg-zinc-800'
                      : 'bg-zinc-700 hover:bg-zinc-600',
                  ].join(' ')}
                  onClick={() => void runDecision(decisionDialog.action)}
                >
                  {decisionSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Working…
                    </>
                  ) : decisionDialog.action === 'approve' ? (
                    'Approve'
                  ) : (
                    'Decline'
                  )}
                </button>
              </div>
            </>
          ) : null}

          {decisionDialog.kind === 'success' ? (
            <div className="text-center">
              {decisionDialog.action === 'approve' ? (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <Handshake className="h-8 w-8" strokeWidth={1.75} />
                </div>
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                  <span className="text-2xl font-light" aria-hidden>
                    ✓
                  </span>
                </div>
              )}
              <h2
                id="decision-dialog-title"
                className="mt-5 font-serif text-xl font-medium text-zinc-900"
              >
                {decisionDialog.action === 'approve'
                  ? 'Approved successfully'
                  : 'Decline recorded'}
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                {decisionDialog.action === 'approve'
                  ? 'They can now sign in as a photographer and complete their public profile.'
                  : 'The applicant has been notified in the app.'}
              </p>
              <button
                type="button"
                className="mt-8 w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={() => setDecisionDialog(null)}
              >
                Done
              </button>
            </div>
          ) : null}

          {decisionDialog.kind === 'error' ? (
            <>
              <h2
                id="decision-dialog-title"
                className="pr-10 font-serif text-xl font-medium text-zinc-900"
              >
                Something went wrong
              </h2>
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">
                {decisionDialog.message}
              </p>
              <button
                type="button"
                className="mt-6 w-full rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                onClick={() => setDecisionDialog(null)}
              >
                Close
              </button>
            </>
          ) : null}
        </div>
      </div>
    ) : null}
    </>
  );
}

function LinkRow({ label, value }: { label: string; value?: string }) {
  const href = normalizeUrl(value ?? '');
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <p className="mt-1 text-sm text-zinc-900">{value?.trim() || '—'}</p>
      </div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          Open <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  );
}

function PortfolioLinks({ value }: { value?: string }) {
  const links = splitLinks(value);
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Portfolio links
      </p>
      {links.length === 0 ? (
        <p className="mt-1 text-sm text-zinc-900">—</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {links.map((l) => {
            const href = normalizeUrl(l);
            return (
              <li key={l} className="flex items-center justify-between gap-3">
                <span className="truncate text-zinc-900">{l}</span>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-amber-900 underline"
                >
                  Open
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

