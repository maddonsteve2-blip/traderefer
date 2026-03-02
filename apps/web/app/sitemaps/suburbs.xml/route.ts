import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 86400;

const BASE_URL = 'https://traderefer.au';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const rows = await sql`
            SELECT DISTINCT LOWER(state) as state_slug,
                   LOWER(REPLACE(city, ' ', '-')) as city_slug,
                   LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND suburb IS NOT NULL AND suburb != ''
        `;

        const urlset = rows.map(r =>
            `  <url><loc>${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.75</priority></url>`
        ).join('\n');

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
        console.error('Sitemap suburbs failed:', e);
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
