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
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      // Sitemap routing — API routes serve XML, CDN caches the responses
      { source: "/sitemap.xml", destination: "/api/sitemaps" },
      { source: "/sitemaps/general.xml", destination: "/api/sitemaps/general" },
      { source: "/sitemaps/profiles.xml", destination: "/api/sitemaps/profiles" },
      { source: "/sitemaps/suburbs.xml", destination: "/api/sitemaps/suburbs" },
      { source: "/sitemaps/trades.xml", destination: "/api/sitemaps/trades" },
      { source: "/sitemaps/jobs/:chunk.xml", destination: "/api/sitemaps/jobs/:chunk" },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
