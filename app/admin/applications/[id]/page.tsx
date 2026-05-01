'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  getApplicationById,
  type PhotographerApplication,
} from '@/lib/firebase/admin';
import {
  adminApprovePhotographerApplication,
  adminDeclinePhotographerApplication,
} from '@/lib/firebase/admin-actions';
import { ExternalLink, Loader2 } from 'lucide-react';

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

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [app, setApp] = useState<PhotographerApplication | null>(null);
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) return;
    (async () => {
      const a = await getApplicationById(id);
      setApp(a);
    })();
  }, [user, isAdmin, id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          ADMIN
        </p>
        <h1 className="mt-2 font-serif text-2xl font-medium text-zinc-900">
          Application review
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          <Link href="/admin/inbox" className="underline">
            Inbox
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
                      onClick={async () => {
                        const ok = confirm(
                          `Approve ${app.name} as a photographer?`,
                        );
                        if (!ok) return;
                        const res = await adminApprovePhotographerApplication({
                          applicationId: app.id!,
                          applicantUserId: app.applicantUserId,
                          applicantName: app.name,
                        });
                        if (!res.ok) alert(res.message);
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                      onClick={async () => {
                        const ok = confirm(`Decline ${app.name}'s application?`);
                        if (!ok) return;
                        const res = await adminDeclinePhotographerApplication({
                          applicationId: app.id!,
                          applicantUserId: app.applicantUserId,
                          applicantName: app.name,
                        });
                        if (!res.ok) alert(res.message);
                      }}
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Links & portfolio
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <LinkRow label="Instagram" value={app.instagram} />
                <LinkRow label="Website" value={app.website} />
                <PortfolioLinks value={app.portfolioLinks} />
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">Other</p>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Interested in client work
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {app.interestedInClientWork ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    How they heard
                  </dt>
                  <dd className="mt-1 text-zinc-900">
                    {app.howDidYouHear || '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Applicant UID
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-zinc-600">
                    {app.applicantUserId}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
    </div>
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

