'use client';

import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { subscribeAdminEvents, subscribeRecentApplications, type AdminEvent, type PhotographerApplication } from '@/lib/firebase/admin';
import { adminUpdateUser } from '@/lib/firebase/admin-actions';

export type AdminInboxCounts = {
  newApplications: number;
  newEvents: number;
  total: number;
};

type SeenState = {
  adminLastSeenApplicationsAt?: number | null;
  adminLastSeenEventsAt?: number | null;
};

function tsToMillis(v: any): number | null {
  if (!v) return null;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  return null;
}

export function subscribeAdminInboxCounts(
  adminUid: string,
  cb: (counts: AdminInboxCounts) => void,
): Unsubscribe {
  let seen: SeenState = {};
  let apps: PhotographerApplication[] = [];
  let events: AdminEvent[] = [];

  const emit = () => {
    const appsSeenAt = seen.adminLastSeenApplicationsAt ?? 0;
    const eventsSeenAt = seen.adminLastSeenEventsAt ?? 0;
    const newApplications = apps.filter((a) => {
      if (a.status !== 'submitted') return false;
      const created = tsToMillis(a.createdAt);
      // If timestamp hasn't resolved yet, treat it as new.
      if (created == null) return true;
      return created > appsSeenAt;
    }).length;
    const newEvents = events.filter((e) => {
      // Only booking lifecycle events belong in the events inbox.
      if (e.type === 'photographer_application') return false;
      const created = tsToMillis(e.createdAt);
      if (created == null) return true;
      return created > eventsSeenAt;
    }).length;
    cb({ newApplications, newEvents, total: newApplications + newEvents });
  };

  const uUser = onSnapshot(
    doc(db, 'users', adminUid),
    (snap) => {
      const d = snap.data() as any;
      seen = {
        adminLastSeenApplicationsAt: tsToMillis(d?.adminLastSeenApplicationsAt),
        adminLastSeenEventsAt: tsToMillis(d?.adminLastSeenEventsAt),
      };
      emit();
    },
    () => {
      seen = {};
      emit();
    },
  );

  const uApps = subscribeRecentApplications((a) => {
    apps = a;
    emit();
  });

  const uEvents = subscribeAdminEvents((e) => {
    events = e;
    emit();
  });

  return () => {
    uUser();
    uApps();
    uEvents();
  };
}

export async function adminMarkInboxSeen(adminUid: string, what: 'applications' | 'events' | 'all') {
  const now = Date.now();
  const patch: any = {};
  if (what === 'applications' || what === 'all') patch.adminLastSeenApplicationsAt = now;
  if (what === 'events' || what === 'all') patch.adminLastSeenEventsAt = now;
  await adminUpdateUser(adminUid, patch);
}

