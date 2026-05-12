import { NotificationsView } from '@/components/notifications-view';

export default function PhotographerNotificationsPage() {
  return (
    <NotificationsView
      threadMessagesBaseHref="/photographer/messages"
      loginRedirectTo="/photographer/notifications"
    />
  );
}
