import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { JOB_TYPES, jobToSlug } from '@/lib/constants';

export const revalidate = 86400;

const BASE_URL = 'https://traderefer.au';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Static pages (auth-gated pages removed: /about, /compare, /rewards, /join)
        const staticUrls = [
            { loc: BASE_URL, priority: '1.0', freq: 'daily' },
            { loc: `${BASE_URL}/businesses`, priority: '0.9', freq: 'daily' },
            { loc: `${BASE_URL}/categories`, priority: '0.95', freq: 'weekly' },
            { loc: `${BASE_URL}/locations`, priority: '0.95', freq: 'weekly' },
            { loc: `${BASE_URL}/local`, priority: '0.9', freq: 'weekly' },
            { loc: `${BASE_URL}/contact`, priority: '0.5', freq: 'monthly' },
            { loc: `${BASE_URL}/terms`, priority: '0.3', freq: 'monthly' },
            { loc: `${BASE_URL}/privacy`, priority: '0.3', freq: 'monthly' },
            { loc: `${BASE_URL}/cookies`, priority: '0.2', freq: 'monthly' },
        ];

        let urlset = staticUrls.map(u =>
            `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`
        ).join('\n');

        // State hub pages
        const stateRows = await sql`
            SELECT DISTINCT LOWER(state) as state_slug
            FROM businesses
            WHERE status = 'active' AND state IS NOT NULL AND state != ''
        `;
        for (const r of stateRows) {
            urlset += `\n  <url><loc>${BASE_URL}/local/${r.state_slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
        }

        // City hub pages
        const cityRows = await sql`
            SELECT DISTINCT LOWER(state) as state_slug,
                   LOWER(REPLACE(city, ' ', '-')) as city_slug
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
        `;
        for (const r of cityRows) {
            urlset += `\n  <url><loc>${BASE_URL}/local/${r.state_slug}/${r.city_slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`;
        }

        // Australia-wide trade hub pages (/trades/[job])
        for (const jobs of Object.values(JOB_TYPES)) {
            for (const job of jobs) {
                urlset += `\n  <url><loc>${BASE_URL}/trades/${jobToSlug(job)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
            }
        }

        // Top-10 pages (/top/[trade]/[state]/[city]) — high-value ranking pages
        const topRows = await sql`
            SELECT DISTINCT
                   LOWER(REPLACE(trade_category, ' ', '-')) as trade_slug,
                   LOWER(state) as state_slug,
                   LOWER(REPLACE(city, ' ', '-')) as city_slug
            FROM businesses
            WHERE status = 'active'
              AND avg_rating IS NOT NULL
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND trade_category IS NOT NULL AND trade_category != ''
        `;
        for (const r of topRows) {
            urlset += `\n  <url><loc>${BASE_URL}/top/${r.trade_slug}/${r.state_slug}/${r.city_slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>`;
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
            },
        });
    } catch (e) {
        console.error('Sitemap general failed:', e);
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
