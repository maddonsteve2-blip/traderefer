import { NextResponse } from 'next/server';

export const revalidate = 86400; // 24-hour edge cache

// Sub-sitemaps are served from the same domain via Next.js rewrites,
// which proxy to the Railway API (no timeout / no response-size limits).
const BASE_URL = 'https://traderefer.au';

export async function GET() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemaps/general</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/profiles</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/suburbs</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/trades</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/top</loc></sitemap>
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
        },
    });
}
