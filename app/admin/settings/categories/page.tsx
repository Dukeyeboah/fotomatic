import { redirect } from 'next/navigation';

/** Categories settings temporarily removed from admin nav. */
export default function AdminCategoriesRedirectPage() {
  redirect('/admin/settings/system');
}
