'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientAppShell } from '@/components/client-app-shell';
import { ContactSupportContent } from '@/components/contact-support-content';

/**
 * Public contact entry. Photographers are sent to their role shell;
 * clients and guests use the shared client chrome.
 */
export default function ContactPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && userData?.role === 'photographer') {
      router.replace('/photographer/contact');
    }
  }, [loading, user, userData, router]);

  if (loading || (user && userData?.role === 'photographer')) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1ec]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <ClientAppShell loginRedirectTo="/contact">
      <ContactSupportContent
        loginRedirectTo="/contact"
        photographersHref="/photographers"
        dashboardHref="/home"
      />
    </ClientAppShell>
  );
}
