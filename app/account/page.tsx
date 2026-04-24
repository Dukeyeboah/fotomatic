'use client';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';

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
          Sign-in details and preferences for your Fotomatic account.
        </p>
        {loading ? (
          <p className="mt-8 text-sm text-zinc-500">Loading…</p>
        ) : !user ? (
          <p className="mt-8 text-sm text-zinc-600">
            <button
              type="button"
              onClick={openLoginModal}
              className="cursor-pointer font-medium text-amber-900 underline"
            >
              Log in
            </button>{' '}
            to manage your account.
          </p>
        ) : (
          <dl className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Email
              </dt>
              <dd className="mt-1 text-zinc-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                User ID
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-zinc-700">
                {user.uid}
              </dd>
            </div>
            {userData?.role ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Role
                </dt>
                <dd className="mt-1 capitalize text-zinc-900">
                  {userData.role}
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </div>
    </div>
  );
}
