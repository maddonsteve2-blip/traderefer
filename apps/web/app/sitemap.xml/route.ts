import { NextResponse } from 'next/server';
import { googleSitemapXml } from '@/lib/sitemaps';

export const runtime = 'nodejs';
export const revalidate = 86400; // 24-hour edge cache

// Google-facing curated sitemap — the release valve of the recovery plan
// (SEO_RECOVERY_PLAN.md Phase 1). Only pages that pass the Google index gates
// are submitted, so the set stays in the low thousands and every URL in it is
// one we expect to index AND hold. The full tree for Bing lives at
// /sitemap-full.xml (submitted directly in Bing Webmaster Tools).
export async function GET() {
    return new NextResponse(await googleSitemapXml(), {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
        },
    });
}
