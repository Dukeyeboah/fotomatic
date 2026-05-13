'use client';

import { useEffect, useState } from 'react';
import { subscribeAllPhotographerReviewStats } from '@/lib/firebase/photographer-reviews';

export function usePhotographerDirectoryReviewStats(): Map<
  string,
  { average: number; count: number }
> {
  const [map, setMap] = useState(
    () => new Map<string, { average: number; count: number }>(),
  );

  useEffect(() => subscribeAllPhotographerReviewStats(setMap), []);

  return map;
}
