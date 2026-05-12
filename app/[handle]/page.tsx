import { redirect } from 'next/navigation';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';

/**
 * Legacy URLs `/{slug}` redirect to `/photographer/{slug}`.
 */
export default async function LegacyProfileHandlePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const slug = typeof handle === 'string' ? handle.trim() : '';
  if (!slug) redirect('/photographers');
  redirect(publicPhotographerProfilePath(slug));
}
