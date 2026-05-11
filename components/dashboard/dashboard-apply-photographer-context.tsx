'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { JoinPhotographerModal } from '@/components/join-photographer-modal';

type Ctx = {
  openApplyAsPhotographer: () => void;
};

const DashboardApplyPhotographerContext = createContext<Ctx | null>(null);

export function useDashboardApplyAsPhotographer(): () => void {
  const v = useContext(DashboardApplyPhotographerContext);
  if (!v) {
    throw new Error(
      'useDashboardApplyAsPhotographer must be used within DashboardApplyPhotographerProvider',
    );
  }
  return v.openApplyAsPhotographer;
}

export function DashboardApplyPhotographerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const openApplyAsPhotographer = useCallback(() => {
    setModalKey((k) => k + 1);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openApplyAsPhotographer }),
    [openApplyAsPhotographer],
  );

  return (
    <DashboardApplyPhotographerContext.Provider value={value}>
      {children}
      <JoinPhotographerModal
        key={modalKey}
        open={open}
        onClose={() => setOpen(false)}
        loginRedirectTo="/dashboard"
      />
    </DashboardApplyPhotographerContext.Provider>
  );
}
