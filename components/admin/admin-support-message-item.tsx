import type { SupportInboxMessage } from '@/lib/firebase/support-inbox';
import { formatRelativeFromFirestore } from '@/lib/format-relative-time';

export function AdminSupportMessageItem({
  msg,
  onMarkRead,
}: {
  msg: SupportInboxMessage;
  onMarkRead?: (id: string) => void;
}) {
  const preview =
    msg.message.length > 120 ? `${msg.message.slice(0, 117)}…` : msg.message;
  const roleLabel = msg.senderRole === 'photographer' ? 'Photographer' : 'Client';

  return (
    <div className="flex gap-3 border-b border-zinc-100 py-3 last:border-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
        {msg.senderName.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-900">{msg.senderName}</p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
            {roleLabel}
          </span>
          {!msg.readByAdmin ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-900">
              Unread
            </span>
          ) : null}
        </div>
        {msg.subject ? (
          <p className="mt-1 text-xs font-semibold text-zinc-800">
            {msg.subject}
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{preview}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            {formatRelativeFromFirestore(msg.createdAt)}
          </p>
          {!msg.readByAdmin && msg.id && onMarkRead ? (
            <button
              type="button"
              onClick={() => onMarkRead(msg.id!)}
              className="text-xs font-semibold text-amber-900 hover:underline"
            >
              Mark read
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
