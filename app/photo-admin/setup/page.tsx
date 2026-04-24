'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import {
  defaultUserDataFromAuth,
  promoteToPhotographerRole,
} from '@/lib/firebase/user-profile';
import { Loader2 } from 'lucide-react';

export default function PhotoAdminSetupPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const promotedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (promotedRef.current) return;
    promotedRef.current = true;
    (async () => {
      await promoteToPhotographerRole(user.uid);
      await refreshUserData();
    })();
  }, [user, refreshUserData]);

  useEffect(() => {
    if (loading || user) return;
    openLoginModal({ redirectTo: '/photo-admin/setup' });
  }, [loading, user, openLoginModal]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
          PHOTOGRAPHER SETUP
        </p>
        <h1 className="mt-2 font-serif text-2xl font-medium text-zinc-900">
          Your public profile
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Add images, bio, links, and location. This information is stored on your
          Fotomatic account.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="/photo-admin" className="underline">
            Studio gate
          </Link>
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : !user ? (
          <p className="mt-12 text-center text-sm text-zinc-600">
            Sign in to edit your photographer profile.
          </p>
        ) : (
          <div className="mt-8">
            {!userData ? (
              <p className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                Firestore profile is not loaded yet; deploy rules and try
                refreshing. You can still fill this form—saving will sync when
                Firestore is reachable.
              </p>
            ) : null}
            <ProfileSettingsForm
              key={`${user.uid}-${userData?.role ?? 'photographer-local'}`}
              user={user}
              userData={
                userData ?? {
                  ...defaultUserDataFromAuth(user),
                  role: 'photographer',
                }
              }
              onSaved={refreshUserData}
              showMediaUploads
            />
          </div>
        )}
      </div>
    </div>
  );
}
