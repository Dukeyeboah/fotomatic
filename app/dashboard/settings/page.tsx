import { DashboardSettingsPanels } from '@/components/dashboard/dashboard-settings-panels';

export default function DashboardSettingsPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Account settings
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Expand a section below to manage your profile, review account details,
        or contact support—all without leaving your dashboard.
      </p>
      <DashboardSettingsPanels />
    </div>
  );
}
