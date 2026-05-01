'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PhotographersGrid } from '@/components/photographers-grid';
import { getPromoMessageForCode } from '@/lib/promo';

const STORAGE_KEY = 'fotomatic_active_promo';

export function PhotographersGridClient({
  variant = 'marketing',
}: {
  variant?: 'marketing' | 'embedded';
}) {
  const searchParams = useSearchParams();
  const [promoLabel, setPromoLabel] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('promo');
    if (code) {
      const msg = getPromoMessageForCode(code);
      if (msg) {
        setPromoLabel(msg);
        try {
          sessionStorage.setItem(STORAGE_KEY, msg);
        } catch {
          /* ignore */
        }
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setPromoLabel(stored);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  return (
    <PhotographersGrid promoLabel={promoLabel} variant={variant} />
  );
}
