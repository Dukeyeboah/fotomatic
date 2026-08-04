import { Suspense } from 'react';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';
import { PhotographersGridClient } from '@/components/photographers-page-client';

export default function PhotographersPage() {
  return (
    <DashboardLayoutClient allowGuest loginRedirectTo="/photographers">
      <Suspense
        fallback={
          <div className="px-4 py-12 text-center text-sm text-zinc-500 lg:px-10">
            Loading directory…
          </div>
        }
      >
        <PhotographersGridClient variant="embedded" />
      </Suspense>
    </DashboardLayoutClient>
  );
}
