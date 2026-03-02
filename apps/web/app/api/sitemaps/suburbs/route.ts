import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://traderefer.au';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const rows = await sql`
            SELECT DISTINCT
                LOWER(state) as state_slug,
                LOWER(REPLACE(city, ' ', '-')) as city_slug,
                LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND suburb IS NOT NULL AND suburb != ''
        `;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const r of rows) {
            xml += `  <url>\n    <loc>${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.75</priority>\n  </url>\n`;
        }

        xml += '</urlset>';

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
            },
        });
    } catch (e) {
        console.error('Suburbs sitemap error:', e);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
