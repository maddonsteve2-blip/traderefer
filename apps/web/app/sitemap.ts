import { MetadataRoute } from 'next';
import { sql } from '@/lib/db';
import { JOB_TYPES, jobToSlug } from '@/lib/constants';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://traderefer.au';
const BUSINESS_CHUNK_SIZE = 5000;

// ─── Sitemap Chunk IDs ───────────────────────────────────────────────
// 0        = Static + State + City hub pages
// 1..N     = Business profile pages (chunked by BUSINESS_CHUNK_SIZE)
// N+1      = Suburb hub pages
// N+2      = Suburb+Trade combo pages
// N+3      = Top-10 pages (city + suburb)
// N+4      = Trade hub pages (all job types)
// N+5..M   = Job-level pages (suburb+trade × job, chunked)
// ──────────────────────────────────────────────────────────────────────

async function getBusinessCount(): Promise<number> {
    try {
        const rows = await sql`SELECT count(*) as cnt FROM businesses WHERE status = 'active'`;
        return Number(rows[0].cnt);
    } catch { return 0; }
}

async function getJobPageCount(): Promise<number> {
    try {
        const rows = await sql`
            SELECT trade_category, COUNT(DISTINCT (state || '|' || city || '|' || suburb)) as combo_count
            FROM businesses
            WHERE status = 'active'
              AND state IS NOT NULL AND state != ''
              AND city IS NOT NULL AND city != ''
              AND suburb IS NOT NULL AND suburb != ''
              AND trade_category IS NOT NULL AND trade_category != ''
            GROUP BY trade_category
        `;
        let total = 0;
        for (const row of rows) {
            const jobs = JOB_TYPES[row.trade_category as string] || [];
            total += Number(row.combo_count) * jobs.length;
        }
        return total;
    } catch { return 0; }
}

export async function generateSitemaps() {
    const bizCount = await getBusinessCount();
    const bizChunks = Math.ceil(bizCount / BUSINESS_CHUNK_SIZE);

    // Fixed-offset IDs after the business chunks
    const ids: { id: number }[] = [];

    // ID 0: Static + State + City hubs
    ids.push({ id: 0 });

    // IDs 1..bizChunks: Business profiles
    for (let i = 0; i < bizChunks; i++) {
        ids.push({ id: i + 1 });
    }

    const baseAfterBiz = bizChunks + 1;

    // baseAfterBiz + 0: Suburb hub pages
    ids.push({ id: baseAfterBiz });

    // baseAfterBiz + 1: Suburb+Trade combo pages
    ids.push({ id: baseAfterBiz + 1 });

    // baseAfterBiz + 2: Top-10 pages
    ids.push({ id: baseAfterBiz + 2 });

    // baseAfterBiz + 3: Trade hub pages (all job types as national hub)
    ids.push({ id: baseAfterBiz + 3 });

    // baseAfterBiz + 4..: Job-level pages, chunked
    const jobCount = await getJobPageCount();
    const jobChunks = Math.max(1, Math.ceil(jobCount / BUSINESS_CHUNK_SIZE));
    for (let i = 0; i < jobChunks; i++) {
        ids.push({ id: baseAfterBiz + 4 + i });
    }

    return ids;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    try {
    const bizCount = await getBusinessCount();
    const bizChunks = Math.ceil(bizCount / BUSINESS_CHUNK_SIZE);
    const baseAfterBiz = bizChunks + 1;

    // ─── ID 0: Static + State Hubs + City Hubs ───
    if (id === 0) {
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

        return [...staticPages, ...statePages, ...cityPages];
    }

    // ─── IDs 1..bizChunks: Business Profile Pages ───
    if (id >= 1 && id <= bizChunks) {
        const offset = (id - 1) * BUSINESS_CHUNK_SIZE;
        const businesses = await sql`
            SELECT slug, updated_at, created_at FROM businesses
            WHERE status = 'active'
            ORDER BY created_at ASC
            LIMIT ${BUSINESS_CHUNK_SIZE} OFFSET ${offset}
        `;
        return businesses.flatMap((biz) => [
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
            },
        ]);
    }

    // ─── baseAfterBiz + 0: Suburb Hub Pages ───
    if (id === baseAfterBiz) {
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
        return suburbRows.map((r) => ({
            url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.75,
        }));
    }

    // ─── baseAfterBiz + 1: Suburb+Trade Combo Pages ───
    if (id === baseAfterBiz + 1) {
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
        return tradeCombos.map((r) => {
            const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            return {
                url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}/${tradeSlug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        });
    }

    // ─── baseAfterBiz + 2: Top-10 Pages ───
    if (id === baseAfterBiz + 2) {
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

        return [...top10CityPages, ...top10SuburbPages];
    }

    // ─── baseAfterBiz + 3: Trade Hub Pages (national job-type hubs) ───
    if (id === baseAfterBiz + 3) {
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
        return tradeHubPages;
    }

    // ─── baseAfterBiz + 4..: Job-Level Pages (chunked) ───
    if (id >= baseAfterBiz + 4) {
        const jobChunkIndex = id - (baseAfterBiz + 4);
        const offset = jobChunkIndex * BUSINESS_CHUNK_SIZE;

        // Build the full list of job-level URLs, then slice for this chunk
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

        const allJobPages: MetadataRoute.Sitemap = [];
        for (const r of tradeCombos) {
            const tradeSlug = (r.trade_category as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const jobs = JOB_TYPES[r.trade_category as string] || [];
            for (const job of jobs) {
                allJobPages.push({
                    url: `${BASE_URL}/local/${r.state_slug}/${r.city_slug}/${r.suburb_slug}/${tradeSlug}/${jobToSlug(job)}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly' as const,
                    priority: 0.65,
                });
            }
        }

        return allJobPages.slice(offset, offset + BUSINESS_CHUNK_SIZE);
    }

    return [];
    } catch (e) {
        console.error(`Sitemap chunk ${id} failed:`, e);
        return [];
    }
}
