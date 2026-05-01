'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import {
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
  Camera,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

function Row({
  href,
  icon: Icon,
  children,
  onClose,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
    >
      <Icon className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
      {children}
    </Link>
  );
}

export function AdminAccountMenu() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (loading || !user) return null;

  const label = userData?.username?.trim() || user.email?.split('@')[0] || 'Admin';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 sm:pr-3"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
            <CircleUserRound className="h-5 w-5" />
          </span>
        )}
        <span className="hidden max-w-[120px] truncate sm:inline">{label}</span>
        <ChevronDown className="hidden h-4 w-4 text-zinc-500 sm:block" />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          <Row href="/admin" icon={LayoutDashboard} onClose={close}>
            Dashboard
          </Row>
          <Row href="/admin/users" icon={Users} onClose={close}>
            Users
          </Row>
          <Row href="/admin/photographers" icon={Camera} onClose={close}>
            Photographers
          </Row>
          <Row href="/admin/messages" icon={MessageSquare} onClose={close}>
            Support inbox
          </Row>
          <Row href="/admin/settings/system" icon={Settings} onClose={close}>
            Settings
          </Row>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={async () => {
              close();
              await signOutUser();
              router.push('/');
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4 text-zinc-500" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
