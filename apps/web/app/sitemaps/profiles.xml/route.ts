import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 86400;

const BASE_URL = 'https://traderefer.au';

export async function GET() {
    try {
        const businesses = await sql`
            SELECT slug, updated_at, created_at
            FROM businesses
            WHERE status = 'active' AND slug IS NOT NULL AND slug != ''
            ORDER BY created_at ASC
        `;

        const urlset = businesses.map(biz => {
            const lastmod = (biz.updated_at || biz.created_at || new Date()).toISOString().split('T')[0];
            return [
                `  <url><loc>${BASE_URL}/b/${biz.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
                `  <url><loc>${BASE_URL}/b/${biz.slug}/refer</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
            ].join('\n');
        }).join('\n');

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
        console.error('Sitemap profiles failed:', e);
        return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
