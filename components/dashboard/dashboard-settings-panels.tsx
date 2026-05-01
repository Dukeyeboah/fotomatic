'use client';

import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { ProfileSettingsForm } from '@/components/profile-settings-form';
import { SupportInboxComposer } from '@/components/support-inbox-composer';
import { defaultUserDataFromAuth } from '@/lib/firebase/user-profile';

type PanelId = 'profile' | 'account' | 'support';

function usernameFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '—';
  return email.split('@')[0]!;
}

export function DashboardSettingsPanels() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [open, setOpen] = useState<PanelId | null>('profile');

  const toggle = (id: PanelId) => {
    setOpen((cur) => (cur === id ? null : id));
  };

  return (
    <div className="mt-8 space-y-3">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => toggle('profile')}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-zinc-900">
            Profile &amp; public details
          </span>
          <ChevronDown
            className={[
              'h-5 w-5 shrink-0 text-zinc-500 transition-transform',
              open === 'profile' ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>
        {open === 'profile' ? (
          <div className="border-t border-zinc-100 px-5 py-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
              </div>
            ) : !user ? (
              <p className="text-sm text-zinc-600">
                <button
                  type="button"
                  onClick={() =>
                    openLoginModal({ redirectTo: '/dashboard/settings' })
                  }
                  className="font-medium text-amber-900 underline"
                >
                  Log in
                </button>{' '}
                to edit your profile.
              </p>
            ) : (
              <>
                {!userData ? (
                  <p className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                    Your profile is still loading. You can try editing below;
                    saving will create or update your document when rules allow.
                  </p>
                ) : null}
                <ProfileSettingsForm
                  key={`${user.uid}-${userData?.role ?? 'pending'}`}
                  user={user}
                  userData={userData ?? defaultUserDataFromAuth(user)}
                  onSaved={refreshUserData}
                  showMediaUploads={
                    (userData?.role ?? 'user') === 'photographer'
                  }
                />
              </>
            )}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => toggle('account')}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-zinc-900">
            Account summary
          </span>
          <ChevronDown
            className={[
              'h-5 w-5 shrink-0 text-zinc-500 transition-transform',
              open === 'account' ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>
        {open === 'account' ? (
          <div className="border-t border-zinc-100 px-5 py-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
              </div>
            ) : !user ? (
              <p className="text-sm text-zinc-600">
                <button
                  type="button"
                  onClick={() =>
                    openLoginModal({ redirectTo: '/dashboard/settings' })
                  }
                  className="font-medium text-amber-900 underline"
                >
                  Log in
                </button>{' '}
                to view account details.
              </p>
            ) : (
              <dl className="space-y-4 text-sm">
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
                {(userData?.city ||
                  userData?.country ||
                  userData?.state) && (
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
                <p className="text-xs text-zinc-500">
                  To change how you appear publicly, use{' '}
                  <button
                    type="button"
                    onClick={() => setOpen('profile')}
                    className="font-semibold text-amber-900 underline"
                  >
                    Profile &amp; public details
                  </button>{' '}
                  above.
                </p>
              </dl>
            )}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => toggle('support')}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-zinc-900">
            Help / Support
          </span>
          <ChevronDown
            className={[
              'h-5 w-5 shrink-0 text-zinc-500 transition-transform',
              open === 'support' ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>
        {open === 'support' ? (
          <div className="border-t border-zinc-100 px-5 py-6">
            <SupportInboxComposer
              className="border-0 bg-[#faf8f5] shadow-none"
              loginRedirectTo="/dashboard/settings"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
