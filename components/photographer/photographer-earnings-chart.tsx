'use client';

import { MOCK_EARNINGS_CHART_POINTS } from '@/lib/photographer-dashboard-mock';

/** Lightweight SVG line chart (mock series). */
export function PhotographerEarningsChart() {
  const w = 280;
  const h = 100;
  const pad = 8;
  const points = MOCK_EARNINGS_CHART_POINTS;
  const n = points.length;
  const coords = points.map((y, i) => {
    const x = pad + (i / Math.max(1, n - 1)) * (w - pad * 2);
    const yy = pad + (1 - y) * (h - pad * 2);
    return `${x},${yy}`;
  });
  const line = coords.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-24 w-full max-w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(34 197 94 / 0.35)" />
          <stop offset="100%" stopColor="rgb(34 197 94 / 0.02)" />
        </linearGradient>
      </defs>
      <polygon fill="url(#earnFill)" points={area} />
      <polyline
        fill="none"
        stroke="rgb(22 163 74)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={line}
      />
    </svg>
  );
}
