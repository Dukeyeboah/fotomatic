'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  marketingImageFallbackUrl,
  marketingImagePrimaryUrl,
} from '@/lib/fotomatic-marketing-images';

/**
 * Storage-first marketing image `src` with automatic fallback to `public/fotomaticImages/`.
 */
export function useMarketingImageSrc(file: string) {
  const primary = marketingImagePrimaryUrl(file);
  const fallback = marketingImageFallbackUrl(file);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary, file]);

  const onError = useCallback(() => {
    setSrc((current) => (current === fallback ? current : fallback));
  }, [fallback]);

  return {
    src,
    onError,
    isUsingFallback: src === fallback,
    primary,
    fallback,
  };
}
