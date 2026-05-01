import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export function AdminStatCard({
  label,
  value,
  deltaPct,
  icon: Icon,
  tintClass,
  valueIsCurrency,
}: {
  label: string;
  value: string | number;
  deltaPct: number;
  icon: LucideIcon;
  tintClass: string;
  valueIsCurrency?: boolean;
}) {
  const display =
    valueIsCurrency && typeof value === 'number'
      ? `$${value.toLocaleString()}`
      : String(value);
  const up = deltaPct >= 0;

  return (
    <div
      className={`rounded-xl border border-zinc-200/80 p-4 shadow-sm sm:p-5 ${tintClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
            {label}
          </p>
          <p className="mt-2 font-semibold tabular-nums text-zinc-900 sm:text-2xl">
            {display}
          </p>
          <p
            className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-700' : 'text-red-600'}`}
          >
            {up ? (
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            {up ? '+' : ''}
            {deltaPct}% vs last week
          </p>
        </div>
        <div className="rounded-lg bg-white/80 p-2.5 text-zinc-700 shadow-sm ring-1 ring-zinc-900/5">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
