import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PhotographerEarningsClient from './earnings-client';

export default function PhotographerEarningsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <PhotographerEarningsClient />
    </Suspense>
  );
}
