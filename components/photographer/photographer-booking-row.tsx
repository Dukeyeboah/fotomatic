export function PhotographerBookingRow({
  clientName,
  shootType,
  dateTime,
  status,
  totalLabel,
  onSendReminder,
}: {
  clientName: string;
  shootType: string;
  dateTime: string;
  status: 'awaiting_payment' | 'confirmed' | 'paid';
  totalLabel?: string;
  onSendReminder?: () => void;
}) {
  const badge =
    status === 'awaiting_payment'
      ? {
          label: 'Awaiting Payment',
          className: 'bg-amber-100 text-amber-950 ring-amber-200/80',
        }
      : status === 'confirmed'
        ? {
            label: 'Confirmed',
            className: 'bg-emerald-100 text-emerald-950 ring-emerald-200/80',
          }
        : {
            label: 'Paid',
            className: 'bg-zinc-200 text-zinc-800 ring-zinc-300/80',
          };

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 py-4 last:border-0">
      <div className="min-w-0">
        <p className="font-semibold text-zinc-900">{clientName}</p>
        <p className="text-sm text-zinc-600">{shootType}</p>
        <p className="mt-1 text-xs text-zinc-500">{dateTime}</p>
        {totalLabel ? (
          <p className="mt-1 text-sm font-medium text-zinc-800">{totalLabel}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.className}`}
        >
          {badge.label}
        </span>
        {status === 'awaiting_payment' ? (
          <button
            type="button"
            onClick={onSendReminder}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Send Reminder
          </button>
        ) : null}
      </div>
    </div>
  );
}
