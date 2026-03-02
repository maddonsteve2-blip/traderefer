import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { JOB_TYPES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://traderefer.au';
const JOB_CHUNK_SIZE = 5000;

async function getJobPageCount(): Promise<number> {
    try {
        const rows = await sql`
            SELECT trade_category, COUNT(DISTINCT (state || '|' || city || '|' || suburb)) as combo_count
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND suburb IS NOT NULL AND suburb != ''
              AND trade_category IS NOT NULL AND trade_category != ''
            GROUP BY trade_category
        `;
        let total = 0;
        for (const row of rows) {
            const jobs = JOB_TYPES[row.trade_category as string] || [];
            total += Number(row.combo_count) * jobs.length;
        }
        return total;
    } catch {
        return 0;
    }
}

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const jobCount = await getJobPageCount();
        const jobChunks = Math.max(1, Math.ceil(jobCount / JOB_CHUNK_SIZE));

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        const sitemaps = [
            `${BASE_URL}/sitemaps/general.xml`,
            `${BASE_URL}/sitemaps/profiles.xml`,
            `${BASE_URL}/sitemaps/suburbs.xml`,
            `${BASE_URL}/sitemaps/trades.xml`,
        ];
        for (let i = 0; i < jobChunks; i++) {
            sitemaps.push(`${BASE_URL}/sitemaps/jobs/${i}.xml`);
        }

        for (const loc of sitemaps) {
            xml += `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
        }
        xml += '</sitemapindex>';

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
            },
        });
    } catch (e) {
        console.error('Sitemap index error:', e);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></sitemapindex>',
            { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
