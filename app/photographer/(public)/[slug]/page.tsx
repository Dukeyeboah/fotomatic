'use client';

import { useParams } from 'next/navigation';
import { PhotographerPublicProfilePageShell } from '@/components/photographer/photographer-public-profile-page-shell';

export default function PhotographerPublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return <PhotographerPublicProfilePageShell slug={slug} />;
}
