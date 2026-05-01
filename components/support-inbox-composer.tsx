'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { createSupportInboxMessage } from '@/lib/firebase/support-inbox';
import { Loader2 } from 'lucide-react';

export function SupportInboxComposer({
  className = '',
  loginRedirectTo = '/contact',
}: {
  /** Extra classes for the outer wrapper */
  className?: string;
  loginRedirectTo?: string;
}) {
  const { user, userData } = useAuth();
  const { openLoginModal } = useLoginModal();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>(
    'idle',
  );

  if (!user) {
    return (
      <div
        className={[
          'rounded-2xl border border-zinc-200 bg-[#faf8f5] p-6 shadow-sm',
          className,
        ].join(' ')}
      >
        <p className="text-sm text-zinc-700">
          Sign in to send us a message—we&apos;ll get back to you as soon as we
          can.
        </p>
        <button
          type="button"
          onClick={() => openLoginModal({ redirectTo: loginRedirectTo })}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Log in
        </button>
      </div>
    );
  }

  const role =
    userData?.role === 'photographer'
      ? ('photographer' as const)
      : ('client' as const);
  const displayName =
    userData?.displayName?.trim() ||
    userData?.username?.trim() ||
    user.email?.split('@')[0] ||
    'User';
  const email = user.email ?? userData?.email ?? '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subject.trim();
    const trimmed = message.trim();
    if (!subj || !trimmed) return;
    setStatus('sending');
    const res = await createSupportInboxMessage({
      senderUserId: user.uid,
      senderRole: role,
      senderName: displayName,
      senderEmail: email || null,
      subject: subj,
      message: trimmed,
    });
    setStatus(res.ok ? 'ok' : 'err');
    if (res.ok) {
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div
      className={[
        'rounded-2xl border border-zinc-200 bg-[#faf8f5] p-6 shadow-sm',
        className,
      ].join(' ')}
    >
      <p className="text-sm font-semibold text-zinc-900">Contact support</p>
      <p className="mt-1 text-xs text-zinc-600">
        Tell us what you need help with. We typically reply within a couple of
        business days.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-600">Name</label>
          <input
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2.5 text-sm text-zinc-800"
            value={displayName}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Email</label>
          <input
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100/80 px-3 py-2.5 text-sm text-zinc-800"
            value={email}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Subject</label>
          <input
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-amber-900/20"
            placeholder="What is this about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600">Message</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-amber-900/20"
            rows={5}
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={8000}
          />
        </div>
        {status === 'err' ? (
          <p className="text-sm text-red-600">Could not send. Try again.</p>
        ) : null}
        {status === 'ok' ? (
          <p className="text-sm text-emerald-700">
            Thanks—your message was sent successfully.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={status === 'sending' || !subject.trim() || !message.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            'Send message'
          )}
        </button>
      </form>
    </div>
  );
}
