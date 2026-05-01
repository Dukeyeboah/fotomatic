'use client';

/** Mock dual-series line chart: this week vs last week (bookings). */
export function AdminBookingsLineChart() {
  const w = 320;
  const h = 120;
  const pad = 12;
  const thisWeek = [12, 18, 14, 22, 28, 24, 32];
  const lastWeek = [10, 14, 12, 18, 20, 19, 22];
  const max = Math.max(...thisWeek, ...lastWeek, 1);
  const toPath = (vals: number[]) =>
    vals
      .map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
        const y = pad + (1 - v / max) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke="rgb(39 39 42)"
          strokeWidth="2"
          strokeLinecap="round"
          points={toPath(lastWeek)}
          opacity="0.35"
        />
        <polyline
          fill="none"
          stroke="rgb(180 83 9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          points={toPath(thisWeek)}
        />
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-amber-800" /> This week
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-full bg-zinc-300" /> Last week
        </span>
      </div>
    </div>
  );
}

/** Mock bar chart for revenue by day. */
export function AdminRevenueBarChart() {
  const w = 320;
  const h = 120;
  const pad = 12;
  const vals = [420, 680, 510, 890, 720, 950, 640];
  const max = Math.max(...vals, 1);
  const barW = (w - pad * 2) / vals.length - 4;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" aria-hidden>
      {vals.map((v, i) => {
        const x = pad + i * ((w - pad * 2) / vals.length) + 2;
        const bh = ((v / max) * (h - pad * 2)) | 0;
        const y = h - pad - bh;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={bh}
            rx={4}
            fill="rgb(59 130 246)"
            opacity={0.75 + (i % 3) * 0.06}
          />
        );
      })}
    </svg>
  );
}
