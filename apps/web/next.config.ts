import type { NextConfig } from "next";

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
  async rewrites() {
    return {
      // beforeFiles: run BEFORE Next.js filesystem/metadata routes.
      // Required so /sitemap.xml is intercepted before app/sitemap.ts is served.
      beforeFiles: [
        { source: "/sitemap.xml", destination: "/api/sitemaps" },
        { source: "/sitemaps/general.xml", destination: "/api/sitemaps/general" },
        { source: "/sitemaps/profiles.xml", destination: "/api/sitemaps/profiles" },
        { source: "/sitemaps/suburbs.xml", destination: "/api/sitemaps/suburbs" },
        { source: "/sitemaps/trades.xml", destination: "/api/sitemaps/trades" },
        { source: "/sitemaps/jobs/:chunk.xml", destination: "/api/sitemaps/jobs/:chunk" },
      ],
      // afterFiles: run after filesystem check (PostHog proxying)
      afterFiles: [
        {
          source: "/ingest/static/:path*",
          destination: "https://us-assets.i.posthog.com/static/:path*",
        },
        {
          source: "/ingest/:path*",
          destination: "https://us.i.posthog.com/:path*",
        },
      ],
      fallback: [],
    };
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
