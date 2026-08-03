import Link from 'next/link';
import { ClientAppShell } from '@/components/client-app-shell';

export default function TermsPage() {
  return (
    <ClientAppShell loginRedirectTo="/terms">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="font-serif text-3xl font-medium text-zinc-900">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: August 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
          <p>
            By using Fotomatic you agree to these terms. If you do not agree,
            please do not use the service.
          </p>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">The service</h2>
            <p>
              Fotomatic connects clients with independent photographers.
              Photographers are responsible for the quality and delivery of
              their work. Fotomatic provides tools for discovery, booking,
              messaging, and payment facilitation.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Accounts</h2>
            <p>
              You must provide accurate information and keep your login secure.
              You are responsible for activity under your account.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Bookings &amp; payments</h2>
            <p>
              Booking terms (date, location, price) are agreed between client and
              photographer through the platform. Payments are processed via
              Stripe. Platform fees and photographer payouts may apply as
              described in-product or at checkout.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Acceptable use</h2>
            <p>
              Do not misuse the platform, harass others, upload illegal content,
              or attempt to disrupt the service.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Contact</h2>
            <p>
              Questions about these terms:{' '}
              <Link
                href="/dashboard/contact"
                className="font-medium text-amber-900 underline"
              >
                Contact support
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </ClientAppShell>
  );
}
