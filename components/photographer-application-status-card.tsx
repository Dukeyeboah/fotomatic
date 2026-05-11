'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeMyPhotographerApplication,
  type MyPhotographerApplicationSummary,
} from '@/lib/firebase/my-photographer-application';

function statusLabel(status: MyPhotographerApplicationSummary['status']): string {
  switch (status) {
    case 'submitted':
      return 'Under review';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Not approved';
    default:
      return status;
  }
}

function statusDescription(
  status: MyPhotographerApplicationSummary['status'],
): string {
  switch (status) {
    case 'submitted':
      return 'We have your application. You’ll get an in-app notification when there’s an update.';
    case 'approved':
      return 'You’re approved as a photographer. Use your photographer dashboard and profile to finish setup.';
    case 'declined':
      return 'We weren’t able to approve this application. You’re welcome to reach out via Help / Support if you have questions.';
    default:
      return '';
  }
}

export function PhotographerApplicationStatusCard({
  className = '',
  domId,
}: {
  className?: string;
  /** Set for deep-link scroll (e.g. settings `#photographer-application`). */
  domId?: string;
}) {
  const { user, userData } = useAuth();
  const [app, setApp] = useState<MyPhotographerApplicationSummary | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!user?.uid || userData?.role === 'photographer' || userData?.role === 'admin') {
      setApp(null);
      return;
    }
    return subscribeMyPhotographerApplication(user.uid, setApp);
  }, [user?.uid, userData?.role]);

  if (userData?.role === 'photographer' || userData?.role === 'admin') {
    return null;
  }

  if (app === undefined) {
    return (
      <div
        id={domId}
        className={`rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500 shadow-sm ${className}`}
      >
        Loading application status…
      </div>
    );
  }

  if (!app) {
    return (
      <div
        id={domId}
        className={`rounded-2xl border border-dashed border-zinc-300 bg-white p-5 shadow-sm ${className}`}
      >
        <p className="text-sm font-semibold text-zinc-900">
          Photographer application
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          You haven’t submitted an application yet. You can apply from your
          dashboard home or the marketing site.
        </p>
      </div>
    );
  }

  return (
    <div
      id={domId}
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
    >
      <p className="text-sm font-semibold text-zinc-900">
        Photographer application
      </p>
      {app.name ? (
        <p className="mt-1 text-xs text-zinc-500">Submitted as {app.name}</p>
      ) : null}
      <p className="mt-3 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-800">
        Status: {statusLabel(app.status)}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">
        {statusDescription(app.status)}
      </p>
    </div>
  );
}
