import posthog from "posthog-js";

// Defer PostHog initialization to improve LCP and reduce TBT
if (typeof window !== 'undefined') {
  // Use requestIdleCallback to defer non-critical tracking initialization
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: '2026-01-30',
        capture_exceptions: true,
        debug: false,
        // Disable autocapture to reduce initial JS execution
        autocapture: false,
        // Disable session recording to reduce bundle size
        disable_session_recording: true,
      });
    });
  } else {
    // Fallback: delay initialization by 2 seconds
    setTimeout(() => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: '2026-01-30',
        capture_exceptions: true,
        debug: false,
        autocapture: false,
        disable_session_recording: true,
      });
    }, 2000);
  }
}

//IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches, especially components like a PostHogProvider. instrumentation-client.ts is the correct solution for initializating client-side PostHog in Next.js 15.3+ apps.
