export default function DashboardPaymentsPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Payments
      </h1>
      <p className="mt-2 max-w-xl text-sm text-zinc-600">
        Secure checkout is coming soon (e.g. Stripe). When a photographer
        accepts your booking, you&apos;ll complete payment here.
      </p>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-zinc-600">No payment history yet.</p>
      </div>
    </div>
  );
}
