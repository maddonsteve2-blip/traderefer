import { MetadataRoute } from 'next';
import { sql } from '@/lib/db';
import { AUSTRALIA_LOCATIONS, JOB_TYPES, jobToSlug } from '@/lib/constants';

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

    // 3. State hub pages (from AUSTRALIA_LOCATIONS)
    const stateMap: Record<string, string> = {
        'VIC': 'vic', 'NSW': 'nsw', 'QLD': 'qld', 'WA': 'wa',
        'SA': 'sa', 'TAS': 'tas', 'ACT': 'act', 'NT': 'nt'
    };
    const statePages: MetadataRoute.Sitemap = Object.keys(AUSTRALIA_LOCATIONS).map(stateKey => ({
        url: `${BASE_URL}/local/${stateMap[stateKey] || stateKey.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // 4. City hub pages
    const cityPages: MetadataRoute.Sitemap = [];
    for (const [stateKey, cities] of Object.entries(AUSTRALIA_LOCATIONS)) {
        const stateSlug = stateMap[stateKey] || stateKey.toLowerCase();
        for (const cityName of Object.keys(cities)) {
            cityPages.push({
                url: `${BASE_URL}/local/${stateSlug}/${cityName.toLowerCase().replace(/\s+/g, '-')}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.85,
            });
        }
    }

    // 5. Suburb hub pages (only suburbs in AUSTRALIA_LOCATIONS)
    const suburbPages: MetadataRoute.Sitemap = [];
    for (const [stateKey, cities] of Object.entries(AUSTRALIA_LOCATIONS)) {
        const stateSlug = stateMap[stateKey] || stateKey.toLowerCase();
        for (const [cityName, suburbs] of Object.entries(cities)) {
            const citySlug = cityName.toLowerCase().replace(/\s+/g, '-');
            for (const suburb of suburbs) {
                suburbPages.push({
                    url: `${BASE_URL}/local/${stateSlug}/${citySlug}/${suburb.toLowerCase().replace(/\s+/g, '-')}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.75,
                });
            }
        }
    }

    // 6. Suburb+Trade pages (only for combos with ≥1 active business)
    const dynamicCombos = await sql`
        SELECT DISTINCT state, city, suburb, trade_category 
        FROM businesses 
        WHERE status = 'active'
          AND suburb IS NOT NULL AND suburb != ''
          AND trade_category IS NOT NULL AND trade_category != ''
    `;

    const localPages: MetadataRoute.Sitemap = dynamicCombos.map((combo) => {
        const stateSlug = (combo.state || 'vic').toLowerCase();
        const citySlug = (combo.city || 'geelong').toLowerCase().replace(/\s+/g, '-');
        const suburbSlug = (combo.suburb || '').toLowerCase().replace(/\s+/g, '-');
        const tradeSlug = (combo.trade_category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return {
            url: `${BASE_URL}/local/${stateSlug}/${citySlug}/${suburbSlug}/${tradeSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    // 7. Australia-wide trade hub pages (one per job type)
    const tradeHubPages: MetadataRoute.Sitemap = [];
    for (const [, jobs] of Object.entries(JOB_TYPES)) {
        for (const job of jobs) {
            tradeHubPages.push({
                url: `${BASE_URL}/trades/${jobToSlug(job)}`,
                lastModified: new Date(),
                changeFrequency: 'monthly' as const,
                priority: 0.8,
            });
        }
    }

    return [
        ...staticPages,
        ...businessPages,
        ...statePages,
        ...cityPages,
        ...suburbPages,
        ...localPages,
        ...tradeHubPages,
    ];
}
