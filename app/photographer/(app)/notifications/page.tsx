import { NotificationsView } from '@/components/notifications-view';

export default function PhotographerNotificationsPage() {
  return (
    <NotificationsView
      threadMessagesBaseHref="/photographer/bookings"
      loginRedirectTo="/photographer/notifications"
    />
  );
}
