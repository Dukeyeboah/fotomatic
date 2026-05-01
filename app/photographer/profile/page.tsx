import Link from 'next/link';

export default function PhotographerProfilePage() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">
        Profile
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Edit your public profile, portfolio links, and bio.
      </p>
      <ul className="mt-8 space-y-3">
        <li>
          <Link
            href="/profile"
            className="flex rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Open profile editor →
          </Link>
        </li>
        <li>
          <Link
            href="/photo-admin/setup"
            className="flex rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Photo admin setup (passkey) →
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
