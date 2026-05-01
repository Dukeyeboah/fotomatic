'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing-page';

export function HomeOrDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role === 'admin') {
      router.replace('/admin');
    } else if (userData.role === 'photographer') {
      router.replace('/photographer');
    } else {
      router.replace('/dashboard');
    }
  }, [loading, user, userData, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        <p className="mt-4 text-sm text-zinc-500">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      <p className="mt-4 text-sm text-zinc-500">
        {userData.role === 'admin'
          ? 'Opening admin…'
          : userData.role === 'photographer'
            ? 'Opening your studio…'
            : 'Opening your dashboard…'}
      </p>
    </div>
  );
}
