'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { Loader2 } from 'lucide-react';

/**
 * Legacy `/profile` — clients and photographers are sent to profile inside
 * their dashboard shell. Guests see a short sign-in prompt.
 */
export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { openLoginModal } = useLoginModal();

  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role === 'photographer') {
      router.replace('/photographer/profile');
    } else if (userData.role === 'user') {
      router.replace('/dashboard/profile');
    }
  }, [loading, user, userData, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-medium text-zinc-900">
            Profile
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            <button
              type="button"
              onClick={() =>
                openLoginModal({ redirectTo: '/dashboard/profile' })
              }
              className="font-medium text-amber-900 underline"
            >
              Log in
            </button>{' '}
            or sign up to edit your profile in the dashboard.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block text-sm text-zinc-600 underline"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        </div>
      </div>
    );
  }

  if (userData.role === 'photographer' || userData.role === 'user') {
    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-medium text-zinc-900">
          Profile
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          Admins use the admin area for tools. Open your{' '}
          <Link href="/account" className="font-medium text-amber-900 underline">
            account summary
          </Link>{' '}
          or the admin dashboard from the menu.
        </p>
      </div>
    </div>
  );
}
