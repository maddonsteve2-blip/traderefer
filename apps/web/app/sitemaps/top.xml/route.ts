import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 86400;

const BASE_URL = 'https://traderefer.au';

function tradeToSlug(trade: string): string {
    return trade
        .toLowerCase()
        .replace(/\s*&\s*/g, '-and-')
        .replace(/\s*\/\s*/g, '-or-')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Query all /top/ pages from database (trade/state/city combinations with rated businesses)
        const rows = await sql`
            SELECT DISTINCT
                trade_category,
                LOWER(state) as state_slug,
                LOWER(REPLACE(city, ' ', '-')) as city_slug
            FROM businesses
            WHERE status = 'active'
              AND trade_category IS NOT NULL
              AND state IS NOT NULL
              AND city IS NOT NULL
              AND avg_rating > 0
              AND total_reviews > 0
            ORDER BY trade_category, state_slug, city_slug
        `;

        let urlset = '';
        for (const row of rows) {
            const tradeSlug = tradeToSlug(row.trade_category);
            const url = `${BASE_URL}/top/${tradeSlug}/${row.state_slug}/${row.city_slug}`;
            urlset += `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
            },
        });
    } catch (e) {
        console.error('Top sitemap failed:', e);
        const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
        return new NextResponse(fallback, {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
