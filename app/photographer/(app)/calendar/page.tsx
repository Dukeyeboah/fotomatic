import Link from 'next/link';
import { CalendarDays } from 'lucide-react';

export default function PhotographerCalendarPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Calendar
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Availability and shoots will sync here once connected.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 py-16 text-zinc-500">
        <CalendarDays className="h-10 w-10 text-zinc-400" strokeWidth={1.25} />
        <p className="mt-3 text-sm">Calendar placeholder</p>
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
