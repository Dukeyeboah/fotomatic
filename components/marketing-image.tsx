'use client';

import Image, { type ImageProps } from 'next/image';
import { useMarketingImageSrc } from '@/lib/hooks/use-marketing-image-src';

type Props = Omit<ImageProps, 'src'> & {
  /** File name under `fotomatic-images/` / `public/fotomaticImages/` (e.g. `fotomaticLogo.png`). */
  file: string;
};

/**
 * Next.js `Image` for site marketing assets: tries Firebase Storage first, then local public files.
 */
export function MarketingImage({ file, onError, ...props }: Props) {
  const { src, onError: fallbackOnError } = useMarketingImageSrc(file);

  return (
    <Image
      {...props}
      src={src}
      onError={(e) => {
        fallbackOnError();
        onError?.(e);
      }}
    />
  );
}
