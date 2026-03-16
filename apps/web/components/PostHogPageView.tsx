'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, detectPageType, initScrollDepthTracking } from '@/lib/posthog-events';

export function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pageInfo = detectPageType(pathname);
    
    trackPageView({
      pageUrl: pathname,
      pageTitle: document.title,
      ...pageInfo,
    });

    // Initialize scroll depth tracking for this page
    const cleanup = initScrollDepthTracking();
    return cleanup;
  }, [pathname]);

  return null;
}
