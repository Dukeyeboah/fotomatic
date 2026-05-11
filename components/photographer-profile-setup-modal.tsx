'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import {
  clearPhotographerProfileSetupModal,
} from '@/lib/firebase/user-profile';
import { X } from 'lucide-react';

export function PhotographerProfileSetupModal() {
  const { user, userData, loading, refreshUserData } = useAuth();

  if (loading || !user || !userData || userData.role !== 'photographer') {
    return null;
  }
  if (userData.photographer?.showProfileSetupModal !== true) {
    return null;
  }

  const dismiss = async () => {
    await clearPhotographerProfileSetupModal(user.uid);
    await refreshUserData();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photographer-setup-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => void dismiss()}
      />
      <div className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-zinc-900/10">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-900/70">
              WELCOME
            </p>
            <h2
              id="photographer-setup-title"
              className="mt-1 font-serif text-xl font-medium text-zinc-900"
            >
              You&apos;re approved — finish your public profile
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              We&apos;ve carried over what you shared on your application. Add a
              profile photo, portfolio images (3–15), and double-check your bio
              and links so clients can book you with confidence.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void dismiss()}
            className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void dismiss()}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              I&apos;ll finish later
            </button>
          </div>
          <ProfileSettingsForm
            key={`setup-${user.uid}`}
            user={user}
            userData={userData}
            showMediaUploads
            onSaved={async () => {
              await refreshUserData();
              await clearPhotographerProfileSetupModal(user.uid);
              await refreshUserData();
            }}
          />
        </div>
      </div>
    </div>
  );
}
