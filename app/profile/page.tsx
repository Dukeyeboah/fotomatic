'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { openLoginModal } = useLoginModal();

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Profile
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Update how you appear and, for photographers, your public details and
          links.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="/account" className="underline">
            Account summary
          </Link>
        </p>
        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
          </div>
        ) : !user || !userData ? (
          <p className="mt-8 text-sm text-zinc-600">
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="cursor-pointer font-medium text-amber-900 underline"
            >
              Log in
            </button>{' '}
            to edit your profile.
          </p>
        ) : (
          <div className="mt-8">
            <ProfileSettingsForm
              key={`${user.uid}-${userData.role}`}
              user={user}
              userData={userData}
              onSaved={refreshUserData}
              showMediaUploads={userData.role === 'photographer'}
            />
          </div>
        )}
      </div>
    </div>
  );
}
