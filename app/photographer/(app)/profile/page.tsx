'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { PublicPhotographerProfileView } from '@/components/public-photographer-profile-view';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { defaultUserDataFromAuth } from '@/lib/firebase/user-profile';
import { directoryPhotographerFromUserData } from '@/lib/photographers-directory';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';
import { isValidPublicProfileSlug } from '@/lib/public-profile-slug';
import { Loader2 } from 'lucide-react';

export default function PhotographerProfileEditorPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [editing, setEditing] = useState(false);

  const preview = useMemo(() => {
    if (!user) return null;
    const data = userData ?? defaultUserDataFromAuth(user);
    return directoryPhotographerFromUserData(data, user.uid);
  }, [user, userData]);

  const publicHref = useMemo(() => {
    const raw = userData?.username?.trim();
    if (!raw || !isValidPublicProfileSlug(raw)) return null;
    return publicPhotographerProfilePath(raw.toLowerCase());
  }, [userData?.username]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-zinc-600">
          <button
            type="button"
            onClick={() =>
              openLoginModal({ redirectTo: '/photographer/profile' })
            }
            className="cursor-pointer font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to view your profile.
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Edit profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Update your public listing: photos, bio, pricing, coverage, and
            links. Changes sync to your public page after you save.
          </p>
        </div>

        <div className="mt-8">
          {!userData ? (
            <p className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
              Your account is signed in, but the app could not load your
              Firestore profile yet. You can still edit below; saving creates or
              updates your profile when rules allow.
            </p>
          ) : null}
          <ProfileSettingsForm
            key={`${user.uid}-${userData?.role ?? 'pending'}`}
            user={user}
            userData={userData ?? defaultUserDataFromAuth(user)}
            onSaved={async () => {
              await refreshUserData();
            }}
            onCancel={() => setEditing(false)}
            onDone={() => setEditing(false)}
            showMediaUploads={(userData?.role ?? 'user') === 'photographer'}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {preview ? (
        <PublicPhotographerProfileView
          photographer={preview}
          hideBackLink
          hideBookingCta
          hideShare={!publicHref}
          compactChrome
          toolbarLeft={
            publicHref ? (
              <Link
                href={publicHref}
                className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline"
              >
                View public page
              </Link>
            ) : null
          }
          bannerOverlay={
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-white/40 bg-black/50 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/65"
            >
              Edit profile
            </button>
          }
        />
      ) : null}
    </div>
  );
}
