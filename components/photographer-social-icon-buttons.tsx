'use client';

import Image from 'next/image';

function normalizeUrl(href: string, kind: 'web' | 'ig'): string {
  const t = href.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (kind === 'ig') {
    const handle = t.replace(/^@/, '');
    return `https://instagram.com/${handle}`;
  }
  return `https://${t.replace(/^\/\//, '')}`;
}

export function PhotographerSocialIconButtons({
  instagram,
  website,
  twitter,
  facebook,
  portfolioLinks,
  size = 'md',
}: {
  instagram?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  portfolioLinks?: string;
  size?: 'sm' | 'md';
}) {
  const ig = instagram?.trim();
  const web = website?.trim();
  const tw = twitter?.trim();
  const fb = facebook?.trim();
  const rawPortfolio = portfolioLinks?.trim();
  const firstPortfolio =
    rawPortfolio?.split(/\s+|,|\n/).map((x) => x.trim()).filter(Boolean)[0] ??
    '';

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const img = size === 'sm' ? 14 : 18;

  const btn =
    'inline-flex items-center justify-center rounded-full border border-zinc-200/90 bg-white shadow-sm transition-opacity hover:opacity-90';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ig ? (
        <a
          href={normalizeUrl(ig, 'ig')}
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram"
          className={btn + ' ' + dim}
        >
          <Image src="/icons/insta.png" alt="" width={img} height={img} />
        </a>
      ) : null}
      {web ? (
        <a
          href={normalizeUrl(web, 'web')}
          target="_blank"
          rel="noopener noreferrer"
          title="Website"
          className={btn + ' ' + dim}
        >
          <Image src="/icons/webIcon.png" alt="" width={img} height={img} />
        </a>
      ) : null}
      {tw ? (
        <a
          href={normalizeUrl(tw, 'web')}
          target="_blank"
          rel="noopener noreferrer"
          title="X / Twitter"
          className={btn + ' ' + dim}
        >
          <Image src="/icons/xIcon.png" alt="" width={img} height={img} />
        </a>
      ) : null}
      {fb ? (
        <a
          href={normalizeUrl(fb, 'web')}
          target="_blank"
          rel="noopener noreferrer"
          title="Facebook"
          className={btn + ' ' + dim}
        >
          <Image src="/icons/facebookIcon.png" alt="" width={img} height={img} />
        </a>
      ) : null}
      {firstPortfolio ? (
        <a
          href={normalizeUrl(firstPortfolio, 'web')}
          target="_blank"
          rel="noopener noreferrer"
          title="Portfolio"
          className={btn + ' ' + dim}
        >
          <Image src="/icons/webIcon.png" alt="" width={img} height={img} />
        </a>
      ) : null}
    </div>
  );
}
