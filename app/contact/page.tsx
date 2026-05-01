import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SupportInboxComposer } from '@/components/support-inbox-composer';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-serif text-3xl font-medium text-zinc-900">
        Contact support
      </h1>
      <p className="mt-3 text-zinc-600">
        We&apos;re here to help with bookings, your account, or photographer
        questions.
      </p>
      <div className="mt-8">
        <SupportInboxComposer loginRedirectTo="/contact" />
      </div>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-zinc-700 hover:text-zinc-900"
      >
        ← Back to home
      </Link>
    </div>
    </div>
  );
}
