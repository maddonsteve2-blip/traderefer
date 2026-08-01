import { isAnonymousSeoPath } from "./lib/public-routes";

if (typeof window !== "undefined" && !isAnonymousSeoPath(window.location.pathname)) {
  void import("posthog-js").then(({ default: posthog }) => {
    // Continue the identity the SEO-page beacon started (SeoBeacon.tsx) so
    // "job page -> register -> signup" reads as one person in funnels.
    let beaconId: string | null = null;
    try { beaconId = localStorage.getItem("tr_anon_id"); } catch { /* no storage */ }
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: false,
      capture_exceptions: true,
      disable_session_recording: true,
      debug: false,
      ...(beaconId ? { bootstrap: { distinctID: beaconId, isIdentifiedID: false } } : {}),
    });
    // capture_pageview is off, so without this the app paths log no views at
    // all and the SEO -> register funnel has no middle step.
    posthog.capture("$pageview");
  });
}

//IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches, especially components like a PostHogProvider. instrumentation-client.ts is the correct solution for initializating client-side PostHog in Next.js 15.3+ apps.
