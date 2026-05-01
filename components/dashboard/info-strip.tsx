import type { LucideIcon } from 'lucide-react';

export function InfoStrip({
  items,
}: {
  items: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }>;
}) {
  return (
    <div className="grid gap-4 border-t border-zinc-200/80 py-10 md:grid-cols-3">
      {items.map(({ icon: Icon, title, description }) => (
        <div
          key={title}
          className="flex gap-4 rounded-2xl border border-zinc-200/70 p-5 shadow-sm shadow-zinc-900/5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-900 shadow-sm ring-1 ring-zinc-900/5">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
