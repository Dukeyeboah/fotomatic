import { redirect } from 'next/navigation';
import { publicPhotographerProfilePath } from '@/lib/public-profile-url';

/** Legacy `/photographers/{slug}` → `/photographer/{slug}`. */
export default async function LegacyPhotographersSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = typeof slug === 'string' ? slug.trim() : '';
  if (!s) redirect('/photographer/directory');
  redirect(publicPhotographerProfilePath(s));
}
