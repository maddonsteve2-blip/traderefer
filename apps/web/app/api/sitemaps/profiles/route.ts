import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://traderefer.au';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const businesses = await sql`
            SELECT slug, updated_at, created_at
            FROM businesses
            WHERE status = 'active'
            ORDER BY created_at ASC
        `;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        for (const biz of businesses) {
            const lastmod = biz.updated_at
                ? new Date(biz.updated_at).toISOString().split('T')[0]
                : biz.created_at
                ? new Date(biz.created_at).toISOString().split('T')[0]
                : today;
            xml += `  <url>\n    <loc>${BASE_URL}/b/${biz.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }

        xml += '</urlset>';

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
            },
        });
    } catch (e) {
        console.error('Profiles sitemap error:', e);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
