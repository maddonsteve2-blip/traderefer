import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const TRADE_CATEGORIES = [
  "Air Conditioning & Heating",
  "Bricklaying",
  "Building & Carpentry",
  "Cabinet Making",
  "Cleaning",
  "Concreting",
  "Demolition",
  "Electrical",
  "Fencing",
  "Flooring",
  "Garage Doors",
  "Gardening & Lawn Care",
  "Glazing",
  "Handyman",
  "Insulation",
  "Landscaping",
  "Locksmith",
  "Painting",
  "Pest Control",
  "Plastering",
  "Plumbing",
  "Renovations",
  "Roofing",
  "Rubbish Removal",
  "Security Systems",
  "Sheds & Outdoor Structures",
  "Solar & Energy",
  "Tiling",
  "Tree Services",
  "Window Cleaning",
  "Other"
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim().toLowerCase() || "";
  const type = searchParams.get("type") || "all"; // 'all', 'trade', 'location'

  if (!query || query.length < 2) {
    return NextResponse.json({ trades: [], suburbs: [], postcodes: [] });
  }

  try {
    // Search trades
    let trades: string[] = [];
    if (type === "all" || type === "trade") {
      trades = TRADE_CATEGORIES.filter(
        (t) => t.toLowerCase().includes(query) && t !== "Other"
      ).slice(0, 6);
    }

    // Search suburbs and postcodes from database
    const suburbs: Array<{ suburb: string; city: string; state: string; postcode: string; count: number }> = [];
    const postcodes: Array<{ postcode: string; suburb: string; city: string; state: string; count: number }> = [];

    if (type === "all" || type === "location") {
      // Search for suburbs by name
      const suburbResults = await sql`
        SELECT 
          suburb,
          city,
          state,
          COALESCE(postcode, '') as postcode,
          COUNT(*)::int as count
        FROM businesses
        WHERE status = 'active'
          AND suburb ILIKE ${'%' + query + '%'}
          AND suburb IS NOT NULL
        GROUP BY suburb, city, state, postcode
        ORDER BY count DESC, suburb ASC
        LIMIT 6
      `;
      suburbResults.forEach(r => suburbs.push(r as any));

      // If query looks like a postcode (digits only), search by postcode
      if (/^\d+$/.test(query)) {
        const postcodeResults = await sql`
          SELECT 
            COALESCE(postcode, '') as postcode,
            suburb,
            city,
            state,
            COUNT(*)::int as count
          FROM businesses
          WHERE status = 'active'
            AND postcode ILIKE ${query + '%'}
            AND postcode IS NOT NULL
          GROUP BY postcode, suburb, city, state
          ORDER BY count DESC, suburb ASC
          LIMIT 6
        `;
        postcodeResults.forEach(r => postcodes.push(r as any));
      }
    }

    return NextResponse.json({ trades, suburbs, postcodes });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ trades: [], suburbs: [], postcodes: [] });
  }
}
