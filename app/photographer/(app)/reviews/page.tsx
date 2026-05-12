'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

export default function PhotographerReviewsPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Reviews
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Client reviews are not enabled in the app yet. When they are, your
        ratings and feedback will show here.
      </p>
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-800">
          <Star className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-serif text-3xl font-medium text-zinc-900">—</p>
          <p className="text-sm text-zinc-600">No reviews yet</p>
        </div>
      </div>
      <Link
        href="/photographer"
        className="mt-8 inline-block text-sm font-semibold text-amber-900 hover:underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
