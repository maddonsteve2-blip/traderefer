'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import('@/lib/posthog-events').then(({ detectPageType, initScrollDepthTracking, trackPageView }) => {
      if (cancelled) return;

      const pageInfo = detectPageType(pathname);

      trackPageView({
        pageUrl: pathname,
        pageTitle: document.title,
        ...pageInfo,
      });

      cleanup = initScrollDepthTracking();
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [pathname]);

  return null;
}
