'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import { CircleUserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function AccountMenuDropdown() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (loading || !user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar URLs
          <img
            src={user.photoURL}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <CircleUserRound className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
        <span className="hidden sm:inline">Account</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-900/5">
          <Link
            href="/photographers"
            className="block px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            Find photographer
          </Link>
          <Link
            href="/profile"
            className="block px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/account"
            className="block px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <button
            type="button"
            className="w-full cursor-pointer px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={async () => {
              setOpen(false);
              await signOutUser();
              router.push('/');
              router.refresh();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
