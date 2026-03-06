import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
    const suburb = req.nextUrl.searchParams.get("suburb") || null;
    const state  = req.nextUrl.searchParams.get("state")  || null;
    const trade  = req.nextUrl.searchParams.get("trade")  || null;
    const q      = req.nextUrl.searchParams.get("q")      || null;
    const page   = Math.max(0, parseInt(req.nextUrl.searchParams.get("page") || "0"));
    const limit  = 12;
    const offset = page * limit;

    const suburbPat = suburb ? `%${suburb}%` : null;
    const statePat  = state  ? `%${state}%`  : null;
    const tradePat  = trade && trade !== "All" ? `%${trade}%` : null;
    const qPat      = q ? `%${q}%` : null;

    try {
        let rows: any[];

        if (suburbPat) {
            rows = await sql`
                WITH user_centroid AS (
                    SELECT AVG(lat) AS clat, AVG(lng) AS clng
                    FROM businesses
                    WHERE suburb ILIKE ${suburbPat} AND lat IS NOT NULL
                )
                SELECT b.id::text, b.business_name, b.slug, b.trade_category,
                       b.suburb, b.state, b.referral_fee_cents, b.logo_url,
                       b.trust_score, b.is_verified, b.avg_rating, b.total_reviews,
                       CASE
                           WHEN b.suburb ILIKE ${suburbPat} THEN 0
                           WHEN b.lat IS NOT NULL AND uc.clat IS NOT NULL
                                AND SQRT(POWER(b.lat - uc.clat, 2) + POWER(b.lng - uc.clng, 2)) < 0.45 THEN 1
                           WHEN b.state ILIKE ${statePat ?? '%'} THEN 2
                           ELSE 3
                       END AS locality_rank
                FROM businesses b, user_centroid uc
                WHERE b.status = 'active'
                  AND (b.listing_visibility = 'public' OR b.listing_visibility IS NULL)
                  AND (${tradePat}::text IS NULL OR b.trade_category ILIKE ${tradePat})
                  AND (${qPat}::text IS NULL OR b.business_name ILIKE ${qPat} OR b.trade_category ILIKE ${qPat} OR b.suburb ILIKE ${qPat})
                ORDER BY locality_rank ASC, b.trust_score DESC, b.avg_rating DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else {
            rows = await sql`
                SELECT id::text, business_name, slug, trade_category,
                       suburb, state, referral_fee_cents, logo_url,
                       trust_score, is_verified, avg_rating, total_reviews
                FROM businesses
                WHERE status = 'active'
                  AND (listing_visibility = 'public' OR listing_visibility IS NULL)
                  AND (${tradePat}::text IS NULL OR trade_category ILIKE ${tradePat})
                  AND (${qPat}::text IS NULL OR business_name ILIKE ${qPat} OR trade_category ILIKE ${qPat} OR suburb ILIKE ${qPat})
                ORDER BY trust_score DESC, avg_rating DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        }

        const cleaned = rows.map(({ locality_rank, ...r }: any) => r);
        return NextResponse.json(cleaned, {
            headers: { "Cache-Control": "private, s-maxage=30" },
        });
    } catch (e) {
        console.error("[discover/browse]", e);
        return NextResponse.json([], { status: 200 });
    }
}
