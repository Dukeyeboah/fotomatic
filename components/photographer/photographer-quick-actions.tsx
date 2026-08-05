import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  MessageCircle,
  Pencil,
  Settings,
} from 'lucide-react';

const actions: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { label: 'Edit Profile', href: '/photographer/profile', icon: Pencil },
  { label: 'Messages', href: '/photographer/messages', icon: MessageCircle },
  { label: 'Availability', href: '/photographer/calendar', icon: Clock },
  { label: 'Account settings', href: '/photographer/settings', icon: Settings },
];

export function PhotographerQuickActionGrid() {
  return (
    <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-center shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:px-2.5 sm:py-2.5"
        >
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-zinc-600"
            strokeWidth={1.75}
          />
          <span className="truncate text-[11px] font-semibold text-zinc-900 sm:text-xs">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
