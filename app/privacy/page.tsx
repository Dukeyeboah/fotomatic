import Link from 'next/link';
import { ClientAppShell } from '@/components/client-app-shell';

export default function PrivacyPage() {
  return (
    <ClientAppShell loginRedirectTo="/privacy">
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <h1 className="font-serif text-3xl font-medium text-zinc-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: August 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">
          <p>
            Fotomatic (“we”, “us”) provides a platform that connects clients with
            photographers. This policy explains how we collect, use, and protect
            information when you use fotomatic.app and related services.
          </p>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Information we collect</h2>
            <p>
              Account details (name, email, profile photo), booking and message
              content you submit, payment-related metadata processed by Stripe
              (we do not store full card numbers), and basic device/usage data
              needed to operate and secure the service.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">How we use information</h2>
            <p>
              To create and manage accounts, facilitate bookings and messaging,
              process payments and payouts, improve the product, and communicate
              about your bookings or account.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Sharing</h2>
            <p>
              We share information with photographers or clients as needed to
              fulfill a booking, and with service providers such as Firebase and
              Stripe who process data on our behalf. We do not sell your personal
              information.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold text-zinc-900">Contact</h2>
            <p>
              Questions about privacy:{' '}
              <Link
                href="/contact"
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
