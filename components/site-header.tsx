'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export function SiteHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3"
          aria-label="Fotomatic home"
        >
          <Image
            src="/fotomaticImages/fotomaticLogo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 object-contain"
          />
          <Image
            src="/fotomaticImages/fotomatic.png"
            alt="Fotomatic"
            width={160}
            height={40}
            className="h-7 w-auto max-w-[150px] object-contain object-left sm:max-w-[180px]"
          />
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium text-zinc-700">
          <button
            type="button"
            className="cursor-pointer hover:text-zinc-900"
            onClick={() => {
              document
                .getElementById('how-it-works')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            How it works
          </button>
          <Link href="/photographers" className="hover:text-zinc-900">
            Photographers
          </Link>
          {!loading &&
            (user ? (
              <button
                type="button"
                className="cursor-pointer hover:text-zinc-900"
                onClick={async () => {
                  await signOutUser();
                  router.push('/');
                  router.refresh();
                }}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
              >
                Log in
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
