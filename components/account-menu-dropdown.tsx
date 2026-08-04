'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase/auth';
import {
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Camera,
  CircleDollarSign,
  Star,
  Settings,
  HelpCircle,
  Home,
  UserRound,
  CalendarCheck,
  CreditCard,
  Heart,
  Inbox,
  Search,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

function Row({
  href,
  icon: Icon,
  children,
  onClick,
  className = '',
}: {
  href: string;
  icon: typeof LayoutDashboard;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
      {children}
    </Link>
  );
}

export function AccountMenuDropdown() {
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

  const isPhotographer = userData?.role === 'photographer';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center rounded-full border border-zinc-200 bg-white p-0.5 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google avatar URLs
          <img
            src={user.photoURL}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
            <CircleUserRound className="h-5 w-5" strokeWidth={1.75} />
          </span>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-900/5">
          {userData?.role === 'admin' ? (
            <Row
              href="/admin"
              icon={LayoutDashboard}
              onClick={close}
              className="font-semibold text-amber-900"
            >
              Admin dashboard
            </Row>
          ) : null}
          {userData?.role === 'admin' ? (
            <Row href="/admin/inbox" icon={Inbox} onClick={close}>
              Applications & bookings
            </Row>
          ) : null}

          {isPhotographer ? (
            <>
              <Row href="/photographer" icon={Camera} onClick={close}>
                Photographer dashboard
              </Row>
              <Row href="/photographer/profile" icon={UserRound} onClick={close}>
                My profile
              </Row>
              <Row
                href="/photographer/requests"
                icon={Search}
                onClick={close}
              >
                Requests
              </Row>
              <Row
                href="/photographer/bookings"
                icon={CalendarCheck}
                onClick={close}
              >
                Bookings
              </Row>
              <Row
                href="/photographer/messages"
                icon={MessageCircle}
                onClick={close}
              >
                Messages
              </Row>
              <Row
                href="/photographer/earnings"
                icon={CircleDollarSign}
                onClick={close}
              >
                Earnings
              </Row>
              <Row href="/photographer/reviews" icon={Star} onClick={close}>
                Reviews
              </Row>
              <Row
                href="/photographer/settings"
                icon={Settings}
                onClick={close}
              >
                Account settings
              </Row>
            </>
          ) : (
            <>
              <Row href="/home" icon={Home} onClick={close}>
                Home
              </Row>
              <Row href="/photographers" icon={Search} onClick={close}>
                Photographers
              </Row>
              <Row
                href="/messages"
                icon={MessageCircle}
                onClick={close}
              >
                Messages
              </Row>
              <Row
                href="/bookings"
                icon={CalendarCheck}
                onClick={close}
              >
                My bookings
              </Row>
              <Row href="/saved" icon={Heart} onClick={close}>
                Saved
              </Row>
              <Row
                href="/payments"
                icon={CreditCard}
                onClick={close}
              >
                Payments
              </Row>
              <Row
                href="/settings"
                icon={Settings}
                onClick={close}
              >
                Account settings
              </Row>
            </>
          )}

          <Row
            href={
              isPhotographer ? '/photographer/contact' : '/contact'
            }
            icon={HelpCircle}
            onClick={close}
          >
            Help / Support
          </Row>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            onClick={async () => {
              close();
              await signOutUser();
              router.push('/');
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
