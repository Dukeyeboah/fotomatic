'use client';

import { useCallback, useState } from 'react';
import {
  Copy,
  Link2,
  Mail,
  Share2,
  Smartphone,
} from 'lucide-react';
import { buildPublicPhotographerProfileUrl } from '@/lib/public-profile-url';

export function PhotographerProfileSharePanel({
  profileSlug,
  title = 'Share this profile',
}: {
  profileSlug: string | null | undefined;
  title?: string;
}) {
  const slug = (profileSlug ?? '').trim().toLowerCase();
  const [copied, setCopied] = useState(false);

  const url = slug ? buildPublicPhotographerProfileUrl(slug) : '';
  const encTitle = encodeURIComponent('Photography on Fotomatic');
  const body = encodeURIComponent(`View this profile: ${url}`);

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
    } catch {
      /* dismissed */
    }
  }, [url]);

  if (!slug) {
    return (
      <p className="text-sm text-zinc-500">
        This photographer has not set a public username yet.
      </p>
    );
  }

  const wa = `https://wa.me/?text=${body}`;
  const tw = `https://twitter.com/intent/tweet?text=${encTitle}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const mail = `mailto:?subject=${encTitle}&body=${body}`;
  const sms = `sms:?&body=${body}`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        {typeof navigator !== 'undefined' &&
        'share' in navigator &&
        typeof navigator.share === 'function' ? (
          <button
            type="button"
            onClick={() => void nativeShare()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
          >
            <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            Share…
          </button>
        ) : null}
        <a
          href={sms}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
        >
          <Smartphone className="h-3.5 w-3.5" strokeWidth={1.75} />
          Text
        </a>
        <a
          href={mail}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
        >
          <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
          Mail
        </a>
        <a
          href={tw}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
        >
          <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          X
        </a>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
        >
          <span className="text-[10px] font-bold text-emerald-600">W</span>
          WhatsApp
        </a>
        <a
          href={fb}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
        >
          <span className="text-[11px] font-bold text-blue-600">f</span>
          Facebook
        </a>
      </div>
    </div>
  );
}
