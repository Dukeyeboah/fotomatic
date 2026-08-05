import { redirect } from 'next/navigation';

/** Pricing & fees moved into System settings → Payment systems. */
export default function AdminPricingFeesRedirectPage() {
  redirect('/admin/settings/system');
}
