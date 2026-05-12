'use client';

import Link from 'next/link';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { defaultUserDataFromAuth } from '@/lib/firebase/user-profile';
import { Loader2 } from 'lucide-react';

export default function PhotographerProfileEditorPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
        PHOTOGRAPHER
      </p>
      <h1 className="mt-2 font-serif text-2xl font-medium text-zinc-900">
        Photographer profile
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Update your public directory listing: profile photo, portfolio gallery
        (3–15 images), bio, links, coverage area, and hourly rate. Changes sync
        to the client-facing photographer list after you save.
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        <Link href="/photographer" className="font-medium text-amber-900 underline">
          ← Photographer home
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
            onClick={() => openLoginModal({ redirectTo: '/photographer/profile' })}
            className="cursor-pointer font-medium text-amber-900 underline"
          >
            Log in
          </button>{' '}
          to edit your profile.
        </p>
      ) : (
        <div className="mt-8 max-w-2xl">
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
            onSaved={refreshUserData}
            showMediaUploads={(userData?.role ?? 'user') === 'photographer'}
          />
        </div>
      )}
    </div>
  );
}
