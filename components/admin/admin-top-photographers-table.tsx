import Link from 'next/link';
import type { TopPhotographerRow } from '@/lib/admin-dashboard-metrics';

export function AdminTopPhotographersTable({ rows }: { rows: TopPhotographerRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No photographer booking data yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">Bookings</th>
            <th className="pb-3 pr-4 font-medium">Revenue</th>
            <th className="pb-3 pr-4 font-medium">Response rate</th>
            <th className="pb-3 pr-4 font-medium">Avg response</th>
            <th className="pb-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80"
            >
              <td className="py-3 pr-4 font-medium text-zinc-900">{r.name}</td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700">{r.bookings}</td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700">
                ${r.revenue.toLocaleString()}
              </td>
              <td className="py-3 pr-4 text-zinc-700">{r.responseRate}</td>
              <td className="py-3 pr-4 text-zinc-700">{r.avgResponseHours}</td>
              <td className="py-3">
                <Link
                  href="/admin/photographers"
                  className="text-xs font-semibold text-amber-900 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
