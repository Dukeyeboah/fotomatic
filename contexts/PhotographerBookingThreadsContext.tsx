'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeThreadsForPhotographer,
  type BookingThread,
} from '@/lib/firebase/booking-threads';
import { effectivePhotographerDirectoryId } from '@/lib/photographer-booking-dashboard';

type Ctx = {
  threads: BookingThread[];
  directoryId: string | null;
  loading: boolean;
};

const PhotographerBookingThreadsContext = createContext<Ctx | null>(null);

export function PhotographerBookingThreadsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, userData, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<BookingThread[]>([]);
  const [subLoading, setSubLoading] = useState(true);

  const directoryId = useMemo(() => {
    if (!user || userData?.role !== 'photographer') return null;
    return effectivePhotographerDirectoryId(
      user.uid,
      userData.photographer?.directoryId,
    );
  }, [user, userData?.role, userData?.photographer?.directoryId]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      userData?.role !== 'photographer' ||
      !directoryId
    ) {
      setThreads([]);
      setSubLoading(false);
      return;
    }
    setSubLoading(true);
    const unsub = subscribeThreadsForPhotographer({
      photographerUserId: user.uid,
      directoryId,
      cb: (t) => {
        setThreads(t);
        setSubLoading(false);
      },
    });
    return () => unsub();
  }, [authLoading, user, userData?.role, directoryId]);

  const loading = authLoading || subLoading;

  const value = useMemo(
    () => ({ threads, directoryId, loading }),
    [threads, directoryId, loading],
  );

  return (
    <PhotographerBookingThreadsContext.Provider value={value}>
      {children}
    </PhotographerBookingThreadsContext.Provider>
  );
}

export function usePhotographerBookingThreads(): Ctx {
  const ctx = useContext(PhotographerBookingThreadsContext);
  if (!ctx) {
    throw new Error(
      'usePhotographerBookingThreads must be used within PhotographerBookingThreadsProvider',
    );
  }
  return ctx;
}

export function usePhotographerBookingThreadsOptional(): Ctx | null {
  return useContext(PhotographerBookingThreadsContext);
}
