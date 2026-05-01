import { Suspense } from 'react';
import { PhotographersGridClient } from '@/components/photographers-page-client';

export default function DashboardPhotographersPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-12 text-center text-sm text-zinc-500 lg:px-10">
          Loading directory…
        </div>
      }
    >
      <PhotographersGridClient variant="embedded" />
    </Suspense>
  );
}
