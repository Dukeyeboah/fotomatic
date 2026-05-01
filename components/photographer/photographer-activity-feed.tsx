import {
  Calendar,
  CreditCard,
  Inbox,
  MessageCircle,
  Star,
} from 'lucide-react';
import type { MockActivityItem } from '@/lib/photographer-dashboard-mock';

function ActivityIcon({ kind }: { kind: MockActivityItem['icon'] }) {
  const cls = 'h-4 w-4';
  switch (kind) {
    case 'inbox':
      return <Inbox className={cls} strokeWidth={1.75} />;
    case 'calendar':
      return <Calendar className={cls} strokeWidth={1.75} />;
    case 'credit':
      return <CreditCard className={cls} strokeWidth={1.75} />;
    case 'star':
      return <Star className={cls} strokeWidth={1.75} />;
    default:
      return <MessageCircle className={cls} strokeWidth={1.75} />;
  }
}

const ringForIcon: Record<MockActivityItem['icon'], string> = {
  inbox: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  calendar: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
  credit: 'bg-sky-50 text-sky-900 ring-sky-200/80',
  star: 'bg-violet-50 text-violet-900 ring-violet-200/80',
  message: 'bg-zinc-100 text-zinc-800 ring-zinc-200/80',
};

export function PhotographerActivityFeed({
  items,
}: {
  items: MockActivityItem[];
}) {
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3 py-3 first:pt-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${ringForIcon[item.icon]}`}
          >
            <ActivityIcon kind={item.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-900">{item.message}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{item.timeLabel}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
