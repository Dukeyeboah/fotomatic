'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientAppShell } from '@/components/client-app-shell';
import { ContactSupportContent } from '@/components/contact-support-content';

/**
 * Public / shared contact entry. Logged-in clients are sent into the dashboard
 * shell so Help / Support matches the rest of the client app.
 */
export default function ContactPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && userData?.role === 'user') {
      router.replace('/dashboard/contact');
    }
  }, [loading, user, userData, router]);

  if (loading || (user && (!userData || userData.role === 'user'))) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1ec]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <ClientAppShell loginRedirectTo="/dashboard/contact">
      <ContactSupportContent loginRedirectTo="/dashboard/contact" />
    </ClientAppShell>
  );
}
