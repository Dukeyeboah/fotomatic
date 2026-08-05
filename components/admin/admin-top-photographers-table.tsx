'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { TopPhotographerRow } from '@/lib/admin-dashboard-metrics';

type SortKey = 'bookings' | 'revenue';
type SortDir = 'desc' | 'asc';

export function AdminTopPhotographersTable({
  rows,
}: {
  rows: TopPhotographerRow[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortKey === 'revenue' ? a.revenue : a.bookings;
      const bv = sortKey === 'revenue' ? b.revenue : b.bookings;
      const primary = sortDir === 'desc' ? bv - av : av - bv;
      if (primary !== 0) return primary;
      const secondary =
        sortKey === 'revenue'
          ? b.bookings - a.bookings
          : b.revenue - a.revenue;
      return secondary;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        No photographer booking data yet.
      </p>
    );
  }

  const SortBtn = ({
    label,
    column,
  }: {
    label: string;
    column: SortKey;
  }) => {
    const active = sortKey === column;
    return (
      <button
        type="button"
        onClick={() => toggleSort(column)}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition ${
          active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'
        }`}
      >
        {label}
        {active ? (
          sortDir === 'desc' ? (
            <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
          )
        ) : (
          <span className="inline-flex h-3.5 w-3.5 flex-col justify-center opacity-40">
            <ArrowUp className="h-2.5 w-2.5" strokeWidth={2} />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <th className="pb-3 pr-4 font-medium">Name</th>
            <th className="pb-3 pr-4 font-medium">
              <SortBtn label="Bookings" column="bookings" />
            </th>
            <th className="pb-3 pr-4 font-medium">
              <SortBtn label="Revenue" column="revenue" />
            </th>
            <th className="pb-3 pr-4 font-medium">Response rate</th>
            <th className="pb-3 pr-4 font-medium">Avg response</th>
            <th className="pb-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80"
            >
              <td className="py-3 pr-4">
                <Link
                  href={`/admin/photographers?id=${encodeURIComponent(r.id)}`}
                  className="font-medium text-zinc-900 hover:text-amber-900 hover:underline"
                >
                  {r.name}
                </Link>
              </td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700">
                {r.bookings}
              </td>
              <td className="py-3 pr-4 tabular-nums text-zinc-700">
                ${r.revenue.toLocaleString()}
              </td>
              <td className="py-3 pr-4 text-zinc-700">{r.responseRate}</td>
              <td className="py-3 pr-4 text-zinc-700">{r.avgResponseHours}</td>
              <td className="py-3">
                <Link
                  href={`/admin/photographers?id=${encodeURIComponent(r.id)}`}
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
