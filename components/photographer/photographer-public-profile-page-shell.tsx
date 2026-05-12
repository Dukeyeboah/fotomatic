'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SiteHeader } from '@/components/site-header';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';
import { PhotographerLayoutClient } from '@/components/photographer/photographer-layout-client';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';
import { PublicPhotographerProfileView } from '@/components/public-photographer-profile-view';

export function PhotographerPublicProfilePageShell({ slug }: { slug: string }) {
  const { user, userData, loading } = useAuth();
  const profile = <PublicPhotographerProfileView handle={slug} />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        <SiteHeader />
        {profile}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
      </div>
    );
  }

  if (userData.role === 'photographer') {
    return <PhotographerLayoutClient>{profile}</PhotographerLayoutClient>;
  }

  if (userData.role === 'admin') {
    return <AdminLayoutClient>{profile}</AdminLayoutClient>;
  }

  return (
    <DashboardLayoutClient embedPublicProfile>{profile}</DashboardLayoutClient>
  );
}
