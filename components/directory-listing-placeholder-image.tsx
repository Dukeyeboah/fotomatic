'use client';

import Image, { type ImageProps } from 'next/image';
import { useMarketingImageSrc } from '@/lib/hooks/use-marketing-image-src';

const LOGO_FILE = 'fotomaticLogo.png';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string;
};

/** Directory card/modal placeholder when a photographer has no profile photo. */
export function DirectoryListingPlaceholderImage({
  alt = '',
  className,
  onError,
  ...props
}: Props) {
  const { src, onError: fallbackOnError } = useMarketingImageSrc(LOGO_FILE);

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        fallbackOnError();
        onError?.(e);
      }}
    />
  );
}
