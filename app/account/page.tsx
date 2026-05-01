'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';

function usernameFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '—';
  return email.split('@')[0]!;
}

export default function AccountPage() {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Account
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Overview of your Fotomatic account. Edit details on your profile page.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="/profile" className="underline">
            Edit profile
          </Link>
        </p>
        {loading ? (
          <p className="mt-8 text-sm text-zinc-500">Loading…</p>
        ) : !user ? (
          <p className="mt-8 text-sm text-zinc-600">
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="cursor-pointer font-medium text-amber-900 underline"
            >
              Log in
            </button>{' '}
            to view your account.
          </p>
        ) : (
          <dl className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Username
              </dt>
              <dd className="mt-1 text-zinc-900">
                {userData?.username ?? usernameFromEmail(user.email)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Email
              </dt>
              <dd className="mt-1 text-zinc-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Account type
              </dt>
              <dd className="mt-1 capitalize text-zinc-900">
                {userData?.role === 'admin'
                  ? 'Admin'
                  : userData?.role === 'photographer'
                    ? 'Photographer'
                    : 'Client'}
              </dd>
            </div>
            {(userData?.city || userData?.country || userData?.state) && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Location
                </dt>
                <dd className="mt-1 text-zinc-900">
                  {[userData.city, userData.state, userData.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
