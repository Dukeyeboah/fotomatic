'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { clearPhotographerProfileSetupModal } from '@/lib/firebase/user-profile';
import { needsGuidedPhotographerProfile } from '@/lib/photographer-profile-setup';
import { X } from 'lucide-react';

const SESSION_DISMISS_KEY = 'fotomatic_photog_setup_dismissed';

export function PhotographerProfileSetupModal() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const [dismissedIncomplete, setDismissedIncomplete] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1') {
        setDismissedIncomplete(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (loading || !user || !userData || userData.role !== 'photographer') {
    return null;
  }

  const serverPrompt = userData.photographer?.showProfileSetupModal === true;
  const incomplete =
    needsGuidedPhotographerProfile(userData) && !dismissedIncomplete;
  const open = serverPrompt || incomplete;

  if (!open) return null;

  const dismiss = async () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissedIncomplete(true);
    if (serverPrompt) {
      await clearPhotographerProfileSetupModal(user.uid);
    }
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
              {serverPrompt
                ? 'You’re approved — finish your public profile'
                : 'Finish your public profile'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              To get a shareable link at{' '}
              <span className="font-mono text-[13px] text-zinc-800">
                /photographer/your-name
              </span>
              , choose a <strong>username</strong> (3–40 characters) and save.
              Add a <strong>profile photo</strong> and <strong>banner image</strong>{' '}
              so clients recognize you—then save again so your directory listing
              updates.
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
              try {
                sessionStorage.removeItem(SESSION_DISMISS_KEY);
              } catch {
                /* ignore */
              }
              setDismissedIncomplete(false);
              await clearPhotographerProfileSetupModal(user.uid);
              await refreshUserData();
            }}
          />
        </div>
      </div>
    </div>
  );
}
