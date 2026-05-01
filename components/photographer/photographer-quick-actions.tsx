import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Clock,
  HelpCircle,
  Pencil,
  Tag,
  Wallet,
} from 'lucide-react';

const actions: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { label: 'Edit Profile', href: '/profile', icon: Pencil },
  { label: 'Update Pricing', href: '/photographer/earnings', icon: Tag },
  {
    label: 'Manage Availability',
    href: '/photographer/calendar',
    icon: Clock,
  },
  { label: 'View Calendar', href: '/photographer/calendar', icon: CalendarDays },
  {
    label: 'Payout Settings',
    href: '/photographer/earnings',
    icon: Wallet,
  },
  { label: 'Help Center', href: '/contact', icon: HelpCircle },
];

export function PhotographerQuickActionGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-5 text-center shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faf8f5] text-zinc-800 ring-1 ring-zinc-900/5">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="text-sm font-semibold text-zinc-900">{label}</span>
        </Link>
      ))}
    </div>
  );
}
