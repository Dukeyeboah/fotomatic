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
import { ExternalLink, Loader2, Pencil } from 'lucide-react';

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
      <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
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

  const bannerActions = (
    <div className="flex flex-row items-center gap-1.5 sm:flex-col sm:items-end sm:gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit profile"
        title="Edit profile"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 sm:h-10 sm:w-10"
      >
        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} />
      </button>
      {publicHref ? (
        <Link
          href={publicHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View public profile"
          title="View public profile"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 sm:h-10 sm:w-10"
        >
          <ExternalLink
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            strokeWidth={1.75}
          />
        </Link>
      ) : null}
    </div>
  );

  return (
    <div>
      {preview ? (
        <PublicPhotographerProfileView
          photographer={preview}
          hideBackLink
          hideBookingCta
          hideShare={!publicHref}
          compactChrome
          bannerOverlay={bannerActions}
        />
      ) : null}
    </div>
  );
}
