'use client';

import { useCallback, useState } from 'react';
import { Copy } from 'lucide-react';
import { buildPublicPhotographerProfileUrl } from '@/lib/public-profile-url';

/** Sidebar promo card: copy public profile URL only (full share lives on profile page / modal). */
export function PhotographerShareProfileMenu({
  profileSlug,
}: {
  profileSlug: string | null | undefined;
  onNavigate?: () => void;
}) {
  const slug = (profileSlug ?? '').trim().toLowerCase();
  const [copied, setCopied] = useState(false);

  const url = slug ? buildPublicPhotographerProfileUrl(slug) : '';

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

  if (!slug) {
    return (
      <p className="text-[10px] leading-snug text-zinc-400">
        Set a <strong>username</strong> in Photographer profile to unlock a
        shareable link.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void copyLink()}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
    >
      <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
      {copied ? 'Copied!' : 'Copy profile link'}
    </button>
  );
}
