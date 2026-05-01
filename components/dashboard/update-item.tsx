import { formatRelativeFromFirestore } from '@/lib/format-relative-time';

export function UpdateItem({
  name,
  message,
  createdAt,
  dotClass,
  avatarSrc,
}: {
  name: string;
  message: string;
  createdAt: unknown;
  dotClass: string;
  avatarSrc?: string | null;
}) {
  return (
    <div className="flex gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-zinc-50">
      <div className="relative shrink-0">
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${dotClass}`}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-900">
          <span className="font-semibold">{name}</span>{' '}
          <span className="font-normal text-zinc-600">{message}</span>
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatRelativeFromFirestore(createdAt)}
        </p>
      </div>
    </div>
  );
}
