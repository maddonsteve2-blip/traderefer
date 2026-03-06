import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const ALLOWED = new Set(["hot", "new", "top-earners"]);

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const { type } = await params;
    if (!ALLOWED.has(type)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const suburb = req.nextUrl.searchParams.get("suburb") || null;
    const state = req.nextUrl.searchParams.get("state") || null;
    const suburbPat = suburb ? `%${suburb}%` : null;
    const statePat = state ? `%${state}%` : null;

    try {
        let rows: any[];

        if (type === "hot") {
            rows = suburbPat
                ? await sql`
                    SELECT id::text, business_name, slug, trade_category, suburb, state,
                           referral_fee_cents, logo_url, trust_score, is_verified
                    FROM businesses
                    WHERE status = 'active'
                      AND (listing_visibility = 'public' OR listing_visibility IS NULL)
                      AND referral_fee_cents > 0
                    ORDER BY
                        CASE WHEN suburb ILIKE ${suburbPat} THEN 0
                             WHEN state  ILIKE ${statePat ?? suburbPat} THEN 1
                             ELSE 2 END,
                        referral_fee_cents DESC, trust_score DESC
                    LIMIT 8`
                : await sql`
                    SELECT id::text, business_name, slug, trade_category, suburb, state,
                           referral_fee_cents, logo_url, trust_score, is_verified
                    FROM businesses
                    WHERE status = 'active'
                      AND (listing_visibility = 'public' OR listing_visibility IS NULL)
                      AND referral_fee_cents > 0
                    ORDER BY trust_score DESC, referral_fee_cents DESC
                    LIMIT 8`;
        } else if (type === "new") {
            rows = suburbPat
                ? await sql`
                    SELECT id::text, business_name, slug, trade_category, suburb, state,
                           referral_fee_cents, logo_url, trust_score, is_verified, created_at::text
                    FROM businesses
                    WHERE status = 'active'
                      AND (listing_visibility = 'public' OR listing_visibility IS NULL)
                    ORDER BY
                        CASE WHEN suburb ILIKE ${suburbPat} THEN 0
                             WHEN state  ILIKE ${statePat ?? suburbPat} THEN 1
                             ELSE 2 END,
                        created_at DESC
                    LIMIT 8`
                : await sql`
                    SELECT id::text, business_name, slug, trade_category, suburb, state,
                           referral_fee_cents, logo_url, trust_score, is_verified, created_at::text
                    FROM businesses
                    WHERE status = 'active'
                      AND (listing_visibility = 'public' OR listing_visibility IS NULL)
                    ORDER BY created_at DESC
                    LIMIT 8`;
        } else {
            rows = await sql`
                SELECT r.tier,
                       COALESCE(SUM(e.gross_cents), 0)::int as month_earnings_cents,
                       COUNT(DISTINCT e.lead_id)::int as leads_this_month
                FROM referrer_earnings e
                JOIN referrers r ON r.id = e.referrer_id
                WHERE e.created_at >= date_trunc('month', now())
                GROUP BY r.id, r.tier
                ORDER BY month_earnings_cents DESC
                LIMIT 5
            `;
            return NextResponse.json(
                rows.map((r: any, i: number) => ({ rank: i + 1, ...r })),
                { headers: { "Cache-Control": "public, s-maxage=300" } }
            );
        }

        const cleaned = rows.map((r: any) => {
            const { locality_rank, ...rest } = r;
            return rest;
        });
        return NextResponse.json(cleaned, {
            headers: { "Cache-Control": "public, s-maxage=60" },
        });
    } catch (e) {
        console.error(`[discover/${type}]`, e);
        return NextResponse.json([], { status: 200 });
    }
}
