'use client';

import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          How you appear when booking photographers.
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
            to view your profile.
          </p>
        ) : (
          <div className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-lg font-medium text-zinc-500">
                  {(userData?.displayName || user.email || '?')
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-zinc-900">
                  {userData?.displayName || user.displayName || '—'}
                </p>
                <p className="text-sm text-zinc-600">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
