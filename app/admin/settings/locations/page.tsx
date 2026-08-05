import { redirect } from 'next/navigation';

/** Locations settings temporarily removed from admin nav. */
export default function AdminLocationsRedirectPage() {
  redirect('/admin/settings/system');
}
