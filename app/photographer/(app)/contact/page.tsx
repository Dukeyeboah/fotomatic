import { ContactSupportContent } from '@/components/contact-support-content';

export default function PhotographerContactPage() {
  return (
    <ContactSupportContent
      loginRedirectTo="/photographer/contact"
      photographersHref="/photographer/directory"
      dashboardHref="/photographer"
    />
  );
}
