import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "jsp-bd",
  project: "javascript-nextjs",
  // Route Sentry requests through your server (avoids ad-blockers)
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
