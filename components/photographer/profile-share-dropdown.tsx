'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Copy,
  Link2,
  Mail,
  Share2,
  Smartphone,
} from 'lucide-react';
import { buildPublicPhotographerProfileUrl } from '@/lib/public-profile-url';

export function ProfileShareDropdown({
  profileSlug,
  placement = 'above',
  tone = 'onDark',
  align = 'end',
  menuZClass = 'z-[100]',
  className = '',
  buttonLabel = 'Share',
}: {
  profileSlug: string | null | undefined;
  /** Open menu toward top of screen (typical on banner bottom). */
  placement?: 'above' | 'below';
  tone?: 'onDark' | 'onLight';
  align?: 'end' | 'start';
  menuZClass?: string;
  className?: string;
  buttonLabel?: string;
}) {
  const slug = (profileSlug ?? '').trim().toLowerCase();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const url = slug ? buildPublicPhotographerProfileUrl(slug) : '';
  const title = encodeURIComponent('Photographer on Fotomatic');
  const body = encodeURIComponent(`View this profile: ${url}`);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const copyLink = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [url]);

  const nativeShare = useCallback(async () => {
    if (!url || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({ title: 'Photographer on Fotomatic', url });
      setOpen(false);
    } catch {
      /* dismissed */
    }
  }, [url]);

  if (!slug) return null;

  const wa = `https://wa.me/?text=${body}`;
  const tw = `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const mail = `mailto:?subject=${title}&body=${body}`;
  const sms = `sms:?&body=${body}`;

  const btnDark =
    'flex items-center gap-2 rounded-full border border-white/40 bg-black/45 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/55';
  const btnLight =
    'flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50';

  const menuPos =
    placement === 'above'
      ? 'bottom-full mb-2 origin-bottom'
      : 'top-full mt-2 origin-top';
  const menuAlign = align === 'end' ? 'right-0' : 'left-0';

  return (
    <div className={['relative', className].filter(Boolean).join(' ')} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={tone === 'onDark' ? btnDark : btnLight}
      >
        <Share2 className="h-4 w-4" strokeWidth={1.75} />
        {buttonLabel}
        <ChevronDown
          className={[
            'h-4 w-4 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>
      {open ? (
        <div
          className={[
            'absolute w-[min(100vw-2rem,280px)] max-h-[min(320px,calc(100vh-120px))] overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-zinc-900/10',
            menuZClass,
            menuPos,
            menuAlign,
          ].join(' ')}
        >
          {typeof navigator !== 'undefined' &&
          'share' in navigator &&
          typeof navigator.share === 'function' ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => void nativeShare()}
            >
              <Share2 className="h-4 w-4 text-zinc-500" />
              Share…
            </button>
          ) : null}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => void copyLink()}
          >
            <Copy className="h-4 w-4 text-zinc-500" />
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <a
            href={sms}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <Smartphone className="h-4 w-4 text-zinc-500" />
            SMS / Text
          </a>
          <a
            href={mail}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <Mail className="h-4 w-4 text-zinc-500" />
            Mail
          </a>
          <a
            href={tw}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <Link2 className="h-4 w-4 text-zinc-500" />
            X / Twitter
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-4 w-4 items-center justify-center text-[10px] font-bold text-emerald-600">
              W
            </span>
            WhatsApp
          </a>
          <a
            href={fb}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold text-blue-600">
              f
            </span>
            Facebook
          </a>
        </div>
      ) : null}
    </div>
  );
}
