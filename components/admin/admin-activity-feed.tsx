import type { AdminEvent } from '@/lib/firebase/admin';
import { Calendar, Camera, Star, UserPlus } from 'lucide-react';
import { formatRelativeFromFirestore } from '@/lib/format-relative-time';

function IconForType({ type }: { type: AdminEvent['type'] }) {
  const cls = 'h-4 w-4';
  switch (type) {
    case 'photographer_application':
      return <UserPlus className={cls} strokeWidth={1.75} />;
    case 'booking_requested':
      return <Calendar className={cls} strokeWidth={1.75} />;
    case 'booking_accepted':
      return <Camera className={cls} strokeWidth={1.75} />;
    case 'booking_suggested':
      return <Calendar className={cls} strokeWidth={1.75} />;
    case 'booking_declined':
      return <Calendar className={cls} strokeWidth={1.75} />;
    default:
      return <Star className={cls} strokeWidth={1.75} />;
  }
}

const ring: Record<string, string> = {
  photographer_application: 'bg-violet-100 text-violet-900',
  booking_requested: 'bg-amber-100 text-amber-900',
  booking_accepted: 'bg-emerald-100 text-emerald-900',
  booking_suggested: 'bg-sky-100 text-sky-900',
  booking_declined: 'bg-zinc-200 text-zinc-800',
};

export function AdminActivityFeed({ events }: { events: AdminEvent[] }) {
  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ring[e.type] ?? 'bg-zinc-100 text-zinc-800'}`}
          >
            <IconForType type={e.type} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900">{e.title}</p>
            <p className="line-clamp-2 text-xs text-zinc-600">{e.body}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatRelativeFromFirestore(e.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
