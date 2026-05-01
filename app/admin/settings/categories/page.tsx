import Link from 'next/link';

export default function AdminCategoriesSettingsPage() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-medium text-zinc-900">Categories</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Configure shoot categories and filters. Coming soon.
      </p>
      <Link href="/admin" className="mt-6 inline-block text-sm font-semibold text-amber-900 hover:underline">
        ← Dashboard
      </Link>
    </div>
  );
}
