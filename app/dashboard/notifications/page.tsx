import { NotificationsView } from '@/components/notifications-view';

export default function DashboardNotificationsPage() {
  return (
    <NotificationsView
      threadMessagesBaseHref="/dashboard/messages"
      loginRedirectTo="/dashboard/notifications"
    />
  );
}
