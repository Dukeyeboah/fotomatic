'use client';

import { useParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { PublicPhotographerProfileView } from '@/components/public-photographer-profile-view';

export default function PublicPhotographerProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <SiteHeader />
      <PublicPhotographerProfileView handle={slug} />
    </div>
  );
}
