import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://traderefer.au';

function urlEntry(loc: string, changefreq: string, priority: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
}

export async function GET() {
    try {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Static pages
        xml += urlEntry(BASE_URL, 'daily', '1.0');
        xml += urlEntry(`${BASE_URL}/businesses`, 'daily', '0.9');
        xml += urlEntry(`${BASE_URL}/categories`, 'weekly', '0.95');
        xml += urlEntry(`${BASE_URL}/locations`, 'weekly', '0.95');
        xml += urlEntry(`${BASE_URL}/local`, 'weekly', '0.9');
        xml += urlEntry(`${BASE_URL}/about`, 'monthly', '0.5');
        xml += urlEntry(`${BASE_URL}/login`, 'monthly', '0.3');
        xml += urlEntry(`${BASE_URL}/register`, 'monthly', '0.3');

        // State hub pages
        const stateRows = await sql`
            SELECT DISTINCT LOWER(state) as state_slug
            FROM businesses
            WHERE status = 'active' AND state IS NOT NULL AND state != ''
        `;
        for (const r of stateRows) {
            xml += urlEntry(`${BASE_URL}/local/${r.state_slug}`, 'weekly', '0.9');
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
            xml += urlEntry(`${BASE_URL}/local/${r.state_slug}/${r.city_slug}`, 'weekly', '0.85');
        }

        xml += '</urlset>';

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
            },
        });
    } catch (e) {
        console.error('General sitemap error:', e);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
