import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { JOB_TYPES } from '@/lib/constants';

export const revalidate = 86400; // 24-hour edge cache

const BASE_URL = 'https://traderefer.au';
const CHUNK_SIZE = 5000;

export async function GET() {
    try {
        // Count job-level pages to determine chunk count
        const rows = await sql`
            SELECT trade_category,
                   COUNT(DISTINCT (state || '|' || city || '|' || suburb)) as combo_count
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND suburb IS NOT NULL AND suburb != ''
              AND trade_category IS NOT NULL AND trade_category != ''
            GROUP BY trade_category
        `;
        let totalJobPages = 0;
        for (const row of rows) {
            const jobs = JOB_TYPES[row.trade_category as string] || [];
            totalJobPages += Number(row.combo_count) * jobs.length;
        }
        const jobChunks = Math.max(1, Math.ceil(totalJobPages / CHUNK_SIZE));

        let jobSitemaps = '';
        for (let i = 0; i < jobChunks; i++) {
            jobSitemaps += `  <sitemap><loc>${BASE_URL}/sitemaps/jobs/${i}</loc></sitemap>\n`;
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemaps/general.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/profiles.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/suburbs.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemaps/trades.xml</loc></sitemap>
${jobSitemaps}</sitemapindex>`;

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
