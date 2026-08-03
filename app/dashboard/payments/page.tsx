import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DashboardPaymentsView } from '@/components/dashboard/dashboard-payments-view';

export default function DashboardPaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      }
    >
      <DashboardPaymentsView />
    </Suspense>
  );
}
