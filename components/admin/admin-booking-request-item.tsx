import Link from 'next/link';

export function AdminBookingRequestItem({
  clientName,
  shootType,
  location,
  dateTime,
  threadId,
}: {
  clientName: string;
  shootType: string;
  location: string;
  dateTime: string;
  threadId?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 py-4 last:border-0">
      <div className="min-w-0">
        <p className="font-semibold text-zinc-900">{clientName}</p>
        <p className="text-sm text-zinc-600">{shootType}</p>
        <p className="mt-1 text-xs text-zinc-500">{location}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{dateTime}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200/80">
          New
        </span>
        {threadId ? (
          <Link
            href={`/messages?thread=${encodeURIComponent(threadId)}`}
            className="text-xs font-semibold text-amber-900 underline"
          >
            View
          </Link>
        ) : null}
      </div>
    </div>
  );
}
