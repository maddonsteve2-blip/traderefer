import { MetadataRoute } from 'next';
import { sql } from '@/lib/db';

const BASE_URL = 'https://traderefer.au';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Static Pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/businesses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    // 2. Fetch Business Profile Pages
    const businesses = await sql`
        SELECT slug, updated_at, created_at FROM businesses WHERE status = 'active'
    `;
    const businessPages: MetadataRoute.Sitemap = businesses.flatMap((biz) => [
        {
            url: `${BASE_URL}/b/${biz.slug}`,
            lastModified: biz.updated_at || biz.created_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/b/${biz.slug}/refer`,
            lastModified: biz.updated_at || biz.created_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }
    ]);

    // 3. Fetch Local Directory Pages (Programmatic)
    // We group by unique State/City/Suburb/Trade combinations
    const dynamicCombos = await sql`
        SELECT DISTINCT state, city, suburb, trade_category 
        FROM businesses 
        WHERE status = 'active'
    `;

    const localPages: MetadataRoute.Sitemap = dynamicCombos.map((combo) => {
        const stateSlug = (combo.state || 'vic').toLowerCase();
        const citySlug = (combo.city || 'geelong').toLowerCase().replace(/\s+/g, '-');
        const suburbSlug = (combo.suburb || '').toLowerCase().replace(/\s+/g, '-');
        const tradeSlug = (combo.trade_category || '').toLowerCase().replace(/\s+/g, '-');

        return {
            url: `${BASE_URL}/local/${stateSlug}/${citySlug}/${suburbSlug}/${tradeSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        };
    });

    return [...staticPages, ...businessPages, ...localPages];
}
