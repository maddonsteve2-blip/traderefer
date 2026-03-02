import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { JOB_TYPES, jobToSlug } from '@/lib/constants';

export const revalidate = 86400;

const BASE_URL = 'https://traderefer.au';
const CHUNK_SIZE = 5000;

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ chunk: string }> }
) {
    const { chunk } = await params;
    const chunkIndex = parseInt(chunk, 10);

    if (isNaN(chunkIndex) || chunkIndex < 0) {
        return new NextResponse('Not Found', { status: 404 });
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const offset = chunkIndex * CHUNK_SIZE;

        const rows = await sql`
            SELECT DISTINCT
                   LOWER(state) as state_slug,
                   LOWER(REPLACE(city, ' ', '-')) as city_slug,
                   LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug,
                   trade_category
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND suburb IS NOT NULL AND suburb != ''
              AND trade_category IS NOT NULL AND trade_category != ''
        `;

        // Expand each suburb+trade combo into individual job URLs
        const allJobUrls: string[] = [];
        for (const r of rows) {
            const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const jobs = JOB_TYPES[r.trade_category as string] || [];
            for (const job of jobs) {
                allJobUrls.push(
                    `  <url><loc>${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}/${tradeSlug}/${jobToSlug(job)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.65</priority></url>`
                );
            }
        }

        const chunkUrls = allJobUrls.slice(offset, offset + CHUNK_SIZE);

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunkUrls.join('\n')}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
            },
        });
    } catch (e) {
        console.error(`Sitemap jobs chunk ${chunkIndex} failed:`, e);
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
