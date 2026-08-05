'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePhotographerBookingThreads } from '@/contexts/PhotographerBookingThreadsContext';
import type { BookingThread } from '@/lib/firebase/booking-threads';
import { formatThreadDateDisplay } from '@/lib/photographer-booking-dashboard';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type CalendarEvent = {
  thread: BookingThread;
  dateKey: string;
  kind: 'awaiting_payment' | 'confirmed' | 'awaiting_client';
};

function parseDateKey(raw: string | undefined): string | null {
  const t = raw?.trim() ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function daysUntil(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const event = new Date(y!, m! - 1, d!, 12, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.round((event.getTime() - today.getTime()) / 86_400_000);
}

function kindForStatus(
  status: BookingThread['status'],
): CalendarEvent['kind'] | null {
  if (status === 'accepted_pending_payment') return 'awaiting_payment';
  if (status === 'confirmed') return 'confirmed';
  if (status === 'pending_client_response') return 'awaiting_client';
  return null;
}

function kindClass(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'confirmed':
      return 'bg-emerald-500';
    case 'awaiting_payment':
      return 'bg-amber-500';
    case 'awaiting_client':
      return 'bg-sky-500';
  }
}

function kindLabel(kind: CalendarEvent['kind']): string {
  switch (kind) {
    case 'confirmed':
      return 'Paid / confirmed';
    case 'awaiting_payment':
      return 'Accepted — awaiting payment';
    case 'awaiting_client':
      return 'Awaiting client response';
  }
}

export function PhotographerCalendarView() {
  const { threads, loading } = usePhotographerBookingThreads();
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    for (const t of threads) {
      const dateKey = parseDateKey(t.eventDate);
      const kind = kindForStatus(t.status);
      if (!dateKey || !kind) continue;
      list.push({ thread: t, dateKey, kind });
    }
    return list;
  }, [threads]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.dateKey) ?? [];
      arr.push(e);
      map.set(e.dateKey, arr);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const gridDays = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string | null; day: number | null }> = [];
    for (let i = 0; i < firstDow; i++) cells.push({ key: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ key, day: d });
    }
    while (cells.length % 7 !== 0) cells.push({ key: null, day: null });
    return cells;
  }, [year, month]);

  const upcoming = useMemo(() => {
    return events
      .map((e) => ({ ...e, days: daysUntil(e.dateKey) }))
      .filter((e) => e.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 8);
  }, [events]);

  const selectedEvents = selectedKey
    ? (eventsByDay.get(selectedKey) ?? [])
    : [];

  const todayKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">Calendar</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Accepted and confirmed bookings appear on your calendar automatically.
        Colors update when a client pays.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setCursor(new Date(year, month - 1, 1))
              }
              className="rounded-lg border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-serif text-lg font-medium text-zinc-900">
              {monthLabel}
            </h2>
            <button
              type="button"
              onClick={() =>
                setCursor(new Date(year, month + 1, 1))
              }
              className="rounded-lg border border-zinc-200 p-2 text-zinc-700 hover:bg-zinc-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {gridDays.map((cell, i) => {
              if (!cell.key || cell.day == null) {
                return <div key={`empty-${i}`} className="min-h-[4.5rem]" />;
              }
              const dayEvents = eventsByDay.get(cell.key) ?? [];
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedKey;
              return (
                <button
                  key={cell.key}
                  type="button"
                  title={
                    dayEvents.length
                      ? dayEvents
                          .map(
                            (e) =>
                              `${e.thread.clientName} · ${e.thread.eventType} (${kindLabel(e.kind)})`,
                          )
                          .join('\n')
                      : undefined
                  }
                  onClick={() =>
                    setSelectedKey((k) => (k === cell.key ? null : cell.key))
                  }
                  className={[
                    'flex min-h-[4.5rem] flex-col rounded-xl border p-1.5 text-left transition-colors',
                    isSelected
                      ? 'border-amber-400 bg-amber-50'
                      : isToday
                        ? 'border-zinc-900/30 bg-zinc-50'
                        : 'border-zinc-100 bg-white hover:bg-zinc-50',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'text-xs font-semibold',
                      isToday ? 'text-zinc-900' : 'text-zinc-700',
                    ].join(' ')}
                  >
                    {cell.day}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.thread.id}
                        className={`h-1.5 w-1.5 rounded-full ${kindClass(e.kind)}`}
                      />
                    ))}
                  </div>
                  {dayEvents[0] ? (
                    <span className="mt-auto truncate text-[10px] text-zinc-600">
                      {dayEvents[0].thread.clientName}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 border-t border-zinc-100 pt-4 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Paid / confirmed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Awaiting payment
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
              Awaiting client
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-zinc-900">
              Upcoming shoots
            </h3>
            {loading ? (
              <p className="mt-3 text-sm text-zinc-500">Loading…</p>
            ) : upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No upcoming accepted bookings yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((e) => (
                  <li
                    key={e.thread.id}
                    className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {e.thread.clientName}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-600">
                          {formatThreadDateDisplay(e.dateKey)}
                          {e.thread.eventTimeframe
                            ? ` · ${e.thread.eventTimeframe}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${kindClass(e.kind)}`}
                        title={kindLabel(e.kind)}
                      />
                    </div>
                    {e.days === 0 ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-red-700">
                        Today
                      </p>
                    ) : e.days === 1 ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-amber-800">
                        Tomorrow
                      </p>
                    ) : e.days <= 7 ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-amber-800">
                        In {e.days} days
                      </p>
                    ) : null}
                    <Link
                      href={`/photographer/bookings?thread=${encodeURIComponent(e.thread.id ?? '')}`}
                      className="mt-1.5 inline-block text-[11px] font-semibold text-amber-900 underline"
                    >
                      Open booking
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedKey ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">
                {formatThreadDateDisplay(selectedKey)}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">No shoots this day.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selectedEvents.map((e) => (
                    <li key={e.thread.id} className="text-sm text-zinc-700">
                      <span className="font-semibold">
                        {e.thread.clientName}
                      </span>
                      <span className="text-zinc-500">
                        {' '}
                        · {e.thread.eventType}
                      </span>
                      <p className="text-xs text-zinc-500">
                        {kindLabel(e.kind)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
