'use client';

import { AdminNotificationsView } from '@/components/admin/admin-notifications-view';

export default function AdminNotificationsPage() {
  return (
    <AdminNotificationsView
      threadMessagesBaseHref="/messages"
      loginRedirectTo="/admin/notifications"
    />
  );
}
