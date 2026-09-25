'use client';

import { useEffect, useState } from 'react';

/**
 * Show fixed bottom chrome at the top of the page and again near the bottom;
 * hide it while scrolling through the middle.
 */
export function useBottomChromeVisible(bottomThresholdPx = 72) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const sh = document.documentElement.scrollHeight;
      const atTop = y <= 8;
      const atBottom = y + vh >= sh - bottomThresholdPx;
      setVisible(atTop || atBottom);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [bottomThresholdPx]);

  return visible;
}
