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

export function PhotographerShareProfileMenu({
  profileSlug,
  onNavigate,
}: {
  profileSlug: string | null | undefined;
  onNavigate?: () => void;
}) {
  const slug = (profileSlug ?? '').trim().toLowerCase();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const url = slug ? buildPublicPhotographerProfileUrl(slug) : '';
  const title = encodeURIComponent('My photography on Fotomatic');
  const body = encodeURIComponent(`View my profile: ${url}`);

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
      await navigator.share({ title: 'My Fotomatic profile', url });
      setOpen(false);
      onNavigate?.();
    } catch {
      /* dismissed */
    }
  }, [url, onNavigate]);

  if (!slug) {
    return (
      <p className="text-[10px] leading-snug text-zinc-400">
        Set a <strong>username</strong> in Photographer profile to unlock a
        shareable link.
      </p>
    );
  }

  const wa = `https://wa.me/?text=${body}`;
  const tw = `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const mail = `mailto:?subject=${title}&body=${body}`;
  const sms = `sms:?&body=${body}`;

  return (
    <div className="space-y-2" ref={rootRef}>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
      >
        <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
        {copied ? 'Copied!' : 'Copy link'}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20"
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          More share options
          <ChevronDown
            className={[
              'h-3.5 w-3.5 transition-transform',
              open ? 'rotate-180' : '',
            ].join(' ')}
          />
        </button>
        {open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(320px,calc(100vh-120px))] overflow-y-auto overflow-x-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-zinc-900/10">
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
            <a
              href={sms}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <Smartphone className="h-4 w-4 text-zinc-500" />
              SMS / Text
            </a>
            <a
              href={mail}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <Mail className="h-4 w-4 text-zinc-500" />
              Mail
            </a>
            <a
              href={tw}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <Link2 className="h-4 w-4 text-zinc-500" />
              X / Twitter
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
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
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold text-blue-600">
                f
              </span>
              Facebook
            </a>
            <p className="border-t border-zinc-100 px-3 py-2 text-[10px] leading-snug text-zinc-500">
              {url}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
