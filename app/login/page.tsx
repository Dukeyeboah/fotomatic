'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginModal } from '@/contexts/LoginModalContext';

export default function LoginPage() {
  const router = useRouter();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    openLoginModal();
    router.replace('/');
  }, [openLoginModal, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <p className="text-sm text-zinc-500">Opening sign in…</p>
    </div>
  );
}
