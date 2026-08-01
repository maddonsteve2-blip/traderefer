import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase() || "";
  const type = searchParams.get("type") || "all"; // 'all', 'trade', 'location'

  if (!query || query.length < 2) {
    return NextResponse.json({ trades: [], suburbs: [], postcodes: [] });
  }

  try {
    // Search trades — live from the taxonomy, so suggestions can never offer
    // a category with zero businesses (the old hardcoded list went stale).
    let trades: string[] = [];
    if (type === "all" || type === "trade") {
      const tradeResults = await sql`
        SELECT trade_category, COUNT(*)::int AS n
        FROM businesses
        WHERE status = 'active'
          AND trade_category ILIKE ${'%' + query + '%'}
          AND trade_category IS NOT NULL
        GROUP BY trade_category
        HAVING COUNT(*) >= 3
        ORDER BY n DESC
        LIMIT 6
      `;
      trades = tradeResults.map((r: any) => r.trade_category as string);
    }

    // Search suburbs and postcodes from database
    const suburbs: Array<{ suburb: string; city: string; state: string; count: number }> = [];

    if (type === "all" || type === "location") {
      // Search for suburbs by name
      const suburbResults = await sql`
        SELECT 
          suburb,
          city,
          state,
          COUNT(*)::int as count
        FROM businesses
        WHERE status = 'active'
          AND suburb ILIKE ${'%' + query + '%'}
          AND suburb IS NOT NULL
          AND suburb != ''
        GROUP BY suburb, city, state
        ORDER BY count DESC, suburb ASC
        LIMIT 8
      `;
      suburbResults.forEach(r => suburbs.push(r as any));

      // Also search by city name
      const cityResults = await sql`
        SELECT 
          city as suburb,
          city,
          state,
          COUNT(*)::int as count
        FROM businesses
        WHERE status = 'active'
          AND city ILIKE ${'%' + query + '%'}
          AND city IS NOT NULL
          AND city != ''
          AND (suburb IS NULL OR suburb NOT ILIKE ${'%' + query + '%'})
        GROUP BY city, state
        ORDER BY count DESC, city ASC
        LIMIT 4
      `;
      // Skip city entries that duplicate an already-listed suburb suggestion
      // (e.g. suburb "Parramatta" + city "Parramatta" both matching).
      const seen = new Set(suburbs.map((s) => `${s.suburb.toLowerCase()}|${s.state}`));
      cityResults.forEach((r: any) => {
        const key = `${String(r.suburb).toLowerCase()}|${r.state}`;
        if (!seen.has(key)) {
          seen.add(key);
          suburbs.push(r);
        }
      });
    }

    return NextResponse.json({ trades, suburbs });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ trades: [], suburbs: [] });
  }
}
