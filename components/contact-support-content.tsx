import Link from 'next/link';
import { SupportInboxComposer } from '@/components/support-inbox-composer';

export function ContactSupportContent({
  loginRedirectTo = '/dashboard/contact',
}: {
  loginRedirectTo?: string;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 text-center sm:px-6 lg:py-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900 sm:text-3xl">
        Contact support
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
        We&apos;re here to help with bookings, your account, or photographer
        questions.
      </p>
      <div className="mt-8 text-left">
        <SupportInboxComposer loginRedirectTo={loginRedirectTo} />
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <Link
          href="/dashboard/photographers"
          className="font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        >
          Photographers
        </Link>
        <Link
          href="/dashboard"
          className="font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
