import Link from 'next/link';

export default function PhotographerSettingsPage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Settings
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Account preferences and notifications (placeholder).
      </p>
      <ul className="mt-8 space-y-3">
        <li>
          <Link
            href="/account"
            className="flex rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Account summary →
          </Link>
        </li>
        <li>
          <Link
            href="/contact"
            className="flex rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Help center →
          </Link>
        </li>
      </ul>
      <Link
        href="/photographer"
        className="mt-8 inline-block text-sm font-semibold text-amber-900 hover:underline"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
