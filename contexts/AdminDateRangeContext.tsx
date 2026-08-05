'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AdminRangeId = '7d' | '30d' | '90d';

const RANGE_DAYS: Record<AdminRangeId, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const ADMIN_RANGE_OPTIONS = [
  { id: '7d' as const, label: 'Last 7 days' },
  { id: '30d' as const, label: 'Last 30 days' },
  { id: '90d' as const, label: 'Last 90 days' },
];

type AdminDateRangeContextValue = {
  range: AdminRangeId;
  setRange: (id: AdminRangeId) => void;
  rangeDays: number;
  /** Milliseconds cutoff: items at or after this are in range. */
  rangeStartMs: number;
};

const AdminDateRangeContext = createContext<AdminDateRangeContextValue | null>(
  null,
);

export function AdminDateRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<AdminRangeId>('7d');
  const value = useMemo(() => {
    const days = RANGE_DAYS[range];
    return {
      range,
      setRange,
      rangeDays: days,
      rangeStartMs: Date.now() - days * 24 * 60 * 60 * 1000,
    };
  }, [range]);

  return (
    <AdminDateRangeContext.Provider value={value}>
      {children}
    </AdminDateRangeContext.Provider>
  );
}

export function useAdminDateRange(): AdminDateRangeContextValue {
  const ctx = useContext(AdminDateRangeContext);
  if (!ctx) {
    throw new Error('useAdminDateRange must be used within AdminDateRangeProvider');
  }
  return ctx;
}

export function firestoreTimeMs(v: unknown): number {
  if (
    v &&
    typeof v === 'object' &&
    'toMillis' in v &&
    typeof (v as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (v as { toMillis: () => number }).toMillis();
  }
  if (
    v &&
    typeof v === 'object' &&
    'seconds' in v &&
    typeof (v as { seconds: number }).seconds === 'number'
  ) {
    return (v as { seconds: number }).seconds * 1000;
  }
  return 0;
}
