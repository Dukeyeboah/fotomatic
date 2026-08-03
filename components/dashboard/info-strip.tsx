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
    <div className="border-t border-zinc-200/80 pt-6 pb-0 md:pt-7">
      <div className="grid gap-5 md:grid-cols-3 md:gap-8">
        {items.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-3">
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-900/80"
              strokeWidth={1.75}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
