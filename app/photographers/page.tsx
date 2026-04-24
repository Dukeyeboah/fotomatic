import { Suspense } from 'react';
import { SiteHeader } from '@/components/site-header';
import { PhotographersGridClient } from '@/components/photographers-page-client';

export default function PhotographersPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <Suspense
        fallback={
          <div className="py-24 text-center text-zinc-500">Loading…</div>
        }
      >
        <PhotographersGridClient />
      </Suspense>
    </div>
  );
}
