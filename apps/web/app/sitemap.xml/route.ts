import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { JOB_TYPES } from '@/lib/constants';

export const revalidate = 86400; // 24-hour edge cache

const BASE_URL = 'https://traderefer.au';
const CHUNK_SIZE = 5000;

export async function GET() {
    try {
        // NOTE: Jobs sitemaps removed to preserve crawl budget for a new site.
        // ~220k job-type URLs were consuming crawl quota before core pages got indexed.
        // Re-enable once domain authority is established and core pages are indexed.

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemaps/general.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/profiles.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/suburbs.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/trades.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/top.xml</loc></sitemap>
</sitemapindex>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
            },
        });
    } catch (e) {
        console.error('Sitemap index failed:', e);
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemaps/general.xml</loc></sitemap>
</sitemapindex>`;
        return new NextResponse(fallback, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
