'use client';

import Link from 'next/link';
import { MOCK_REQUESTS } from '@/lib/photographer-dashboard-mock';
import { PhotographerRequestCard } from '@/components/photographer/photographer-request-card';

export default function PhotographerRequestsPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Requests
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Sample data — connect to your live booking inbox later.
          </p>
        </div>
        <Link
          href="/photographer"
          className="text-sm font-semibold text-amber-900 hover:underline"
        >
          ← Dashboard
        </Link>
      </div>
      <div className="mt-8 space-y-4">
        {MOCK_REQUESTS.map((r) => (
          <PhotographerRequestCard
            key={r.id}
            clientName={r.clientName}
            clientImage={r.clientImage}
            shootType={r.shootType}
            location={r.location}
            date={r.date}
            duration={r.duration}
            onAccept={() => alert('Accept — wire to API')}
            onSuggest={() => alert('Suggest time — wire to API')}
            onDecline={() => alert('Decline — wire to API')}
          />
        ))}
      </div>
    </div>
  );
}
