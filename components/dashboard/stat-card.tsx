import type { LucideIcon } from 'lucide-react';

export function StatCard({
  label,
  count,
  subtext,
  icon: Icon,
  tintClass,
}: {
  label: string;
  count: number;
  subtext: string;
  icon: LucideIcon;
  tintClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 p-5 shadow-sm ${tintClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {label}
          </p>
          <p className="mt-2 font-serif text-3xl font-medium tabular-nums text-zinc-900">
            {count}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{subtext}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2.5 text-zinc-700 shadow-sm ring-1 ring-zinc-900/5">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
