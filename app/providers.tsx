'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginModalProvider } from '@/contexts/LoginModalContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LoginModalProvider>{children}</LoginModalProvider>
    </AuthProvider>
  );
}
