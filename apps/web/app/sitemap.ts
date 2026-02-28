import { MetadataRoute } from 'next';
import { sql } from '@/lib/db';
import { JOB_TYPES, jobToSlug } from '@/lib/constants';

const BASE_URL = 'https://traderefer.au';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Static Pages
    const staticPages: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/businesses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
        { url: `${BASE_URL}/locations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
        { url: `${BASE_URL}/local`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
        { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    // 2. Business profile pages
    const businesses = await sql`
        SELECT slug, updated_at, created_at FROM businesses WHERE status = 'active'
    `;
    const businessPages: MetadataRoute.Sitemap = businesses.flatMap((biz) => [
        {
            url: `${BASE_URL}/b/${biz.slug}`,
            lastModified: biz.updated_at || biz.created_at || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/b/${biz.slug}/refer`,
            lastModified: biz.updated_at || biz.created_at || new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }
    ]);

    // 3. State hub pages — all states that have active businesses
    const stateRows = await sql`
        SELECT DISTINCT LOWER(state) as state_slug
        FROM businesses
        WHERE status = 'active' AND state IS NOT NULL AND state != ''
    `;
    const statePages: MetadataRoute.Sitemap = stateRows.map((r) => ({
        url: `${BASE_URL}/local/${r.state_slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    // 4. City hub pages — all cities that have active businesses
    const cityRows = await sql`
        SELECT DISTINCT LOWER(state) as state_slug,
               LOWER(REPLACE(city, ' ', '-')) as city_slug
        FROM businesses
        WHERE status = 'active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
    `;
    const cityPages: MetadataRoute.Sitemap = cityRows.map((r) => ({
        url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.85,
    }));

    // 5. Suburb hub pages — all suburbs that have active businesses
    const suburbRows = await sql`
        SELECT DISTINCT LOWER(state) as state_slug,
               LOWER(REPLACE(city, ' ', '-')) as city_slug,
               LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug
        FROM businesses
        WHERE status = 'active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND suburb IS NOT NULL AND suburb != ''
    `;
    const suburbPages: MetadataRoute.Sitemap = suburbRows.map((r) => ({
        url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
    }));

    // 6. Suburb+Trade pages — only combos with ≥1 active business
    const tradeCombos = await sql`
        SELECT DISTINCT LOWER(state) as state_slug,
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
    const localPages: MetadataRoute.Sitemap = tradeCombos.map((r) => {
        const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return {
            url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}/${tradeSlug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    // 7. Job-level pages — suburb+trade combos × all job types for that trade
    // Temporarily disabled to reduce sitemap size for Vercel deployment
    const jobPages: MetadataRoute.Sitemap = [];
    /*
    const jobPages: MetadataRoute.Sitemap = tradeCombos.flatMap((r) => {
        const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const jobs = JOB_TYPES[r.trade_category as string] || [];
        return jobs.map((job) => ({
            url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}/${tradeSlug}/${jobToSlug(job)}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.65,
        }));
    });
    */

    // 8. Australia-wide trade hub pages (one per job type)
    // Temporarily disabled to reduce sitemap size for Vercel deployment
    const tradeHubPages: MetadataRoute.Sitemap = [];
    /*
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
    */

    // 9. Top-10 city pages — /top/[trade]/[state]/[city] (only combos with ≥10 businesses)
    const top10CityRows = await sql`
        SELECT LOWER(state) as state_slug,
               LOWER(REPLACE(city, ' ', '-')) as city_slug,
               trade_category,
               COUNT(*) as cnt
        FROM businesses
        WHERE status = 'active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND trade_category IS NOT NULL AND trade_category != ''
          AND avg_rating IS NOT NULL
        GROUP BY state, city, trade_category
        HAVING COUNT(*) >= 10
    `;
    const top10CityPages: MetadataRoute.Sitemap = top10CityRows.map((r) => {
        const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return {
            url: `${BASE_URL}/top/${tradeSlug}/${r.state_slug}/${r.city_slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.85,
        };
    });

    // 10. Top-10 suburb pages — /top/[trade]/[state]/[city]/[suburb] (only combos with ≥10 businesses)
    const top10SuburbRows = await sql`
        SELECT LOWER(state) as state_slug,
               LOWER(REPLACE(city, ' ', '-')) as city_slug,
               LOWER(REPLACE(suburb, ' ', '-')) as suburb_slug,
               trade_category,
               COUNT(*) as cnt
        FROM businesses
        WHERE status = 'active'
          AND state IS NOT NULL AND state != ''
          AND city IS NOT NULL AND city != ''
          AND suburb IS NOT NULL AND suburb != ''
          AND trade_category IS NOT NULL AND trade_category != ''
          AND avg_rating IS NOT NULL
        GROUP BY state, city, suburb, trade_category
        HAVING COUNT(*) >= 10
    `;
    const top10SuburbPages: MetadataRoute.Sitemap = top10SuburbRows.map((r) => {
        const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return {
            url: `${BASE_URL}/top/${tradeSlug}/${r.state_slug}/${r.city_slug}/${r.suburb_slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        };
    });

    return [
        ...staticPages,
        ...businessPages,
        ...statePages,
        ...cityPages,
        ...suburbPages,
        ...localPages,
        ...jobPages,
        ...tradeHubPages,
        ...top10CityPages,
        ...top10SuburbPages,
    ];
}
