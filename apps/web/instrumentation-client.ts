import posthog from "posthog-js";

// Initialize PostHog with performance optimizations
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: '2026-01-30',
  capture_exceptions: true,
  debug: false,
  // Performance optimizations
  autocapture: false, // We use manual tracking for better control
  disable_session_recording: true, // Reduce bundle size
  loaded: (posthog) => {
    // Only enable in production
    if (process.env.NODE_ENV === 'development') posthog.opt_out_capturing();
  },
});

//IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches, especially components like a PostHogProvider. instrumentation-client.ts is the correct solution for initializating client-side PostHog in Next.js 15.3+ apps.
