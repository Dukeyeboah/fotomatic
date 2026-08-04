import Link from 'next/link';
import { SupportInboxComposer } from '@/components/support-inbox-composer';

export function ContactSupportContent({
  loginRedirectTo = '/contact',
  photographersHref = '/photographers',
  dashboardHref = '/home',
}: {
  loginRedirectTo?: string;
  photographersHref?: string;
  dashboardHref?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Contact support
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        We&apos;re here to help with bookings, your account, or photographer
        questions.
      </p>
      <div className="mt-8">
        <SupportInboxComposer loginRedirectTo={loginRedirectTo} />
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Link
          href={photographersHref}
          className="font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        >
          Photographers
        </Link>
        <Link
          href={dashboardHref}
          className="font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
