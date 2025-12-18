import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

interface AnalyticsTrackerProps {
  contentId?: string;
  contentType?: 'post' | 'page' | 'video' | 'podcast' | 'category';
}

export default function AnalyticsTracker({ contentId, contentType }: AnalyticsTrackerProps) {
  const router = useRouter();
  const startTime = useRef<number>(typeof window !== 'undefined' ? Date.now() : 0);
  const tracked = useRef<boolean>(false);

  useEffect(() => {
    // Don't track during SSR/SSG
    if (typeof window === 'undefined') {
      return;
    }

    if (!tracked.current) {
      trackEvent('pageview');
      tracked.current = true;
    }

    // Track time on page when user leaves
    const handleBeforeUnload = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);

      // Use sendBeacon for reliable tracking on page unload
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          event: 'time_on_page',
          page: router.asPath,
          title: document.title,
          metadata: {
            timeOnPage,
            postId: contentId,
            contentType,
          },
        });
        navigator.sendBeacon('/api/analytics/track', data);
      }
    };

    // Track route changes
    const handleRouteChange = () => {
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000);
      trackEvent('time_on_page', {
        timeOnPage,
        bounced: timeOnPage < 10, // Consider < 10 seconds as bounce
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router, contentId, contentType]);

  async function trackEvent(event: string, metadata: any = {}) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          page: router.asPath,
          title: document.title,
          referrer: document.referrer || 'direct',
          metadata: {
            postId: contentId,
            contentType,
            ...metadata,
          },
        }),
      });
    } catch (error) {
    }
  }

  // No visible UI - just tracking
  return null;
}
